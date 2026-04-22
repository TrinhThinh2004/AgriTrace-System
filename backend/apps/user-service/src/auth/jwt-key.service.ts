import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { JwtKey, JwtKeyPurpose, JwtKeyStatus } from '../entities/jwt-key.entity';

// Parse ms từ chuỗi kiểu "15m", "7d", "3600s"; fallback = giây nguyên
function parseDurationMs(input: string): number {
  const m = /^(\d+)\s*([smhdw]?)$/i.exec(input.trim());
  if (!m) {
    const n = Number(input);
    if (!Number.isFinite(n)) throw new Error(`Duration không hợp lệ: ${input}`);
    return n * 1000;
  }
  const value = Number(m[1]);
  const unit = (m[2] || 's').toLowerCase();
  const table: Record<string, number> = { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 };
  return value * (table[unit] ?? 1e3);
}

@Injectable()
export class JwtKeyService {
  private readonly logger = new Logger(JwtKeyService.name);
  private cache = new Map<JwtKeyPurpose, { keys: JwtKey[]; exp: number }>();
  private readonly CACHE_TTL_MS = 60_000;

  constructor(
    @InjectRepository(JwtKey)
    private readonly repo: Repository<JwtKey>,
    private readonly config: ConfigService,
  ) {}

  private lifetimeMs(purpose: JwtKeyPurpose): number {
    const exp =
      purpose === 'access'
        ? this.config.get<string>('JWT_ACCESS_EXPIRATION') || '15m'
        : this.config.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    return parseDurationMs(exp);
  }

  // Bootstrap: nếu bảng rỗng, tạo key đầu tiên từ ENV hoặc random
  async ensureBootstrap() {
    const purposes: JwtKeyPurpose[] = ['access', 'refresh'];
    for (const purpose of purposes) {
      const existing = await this.repo.findOne({
        where: { purpose, status: 'active' },
      });
      if (existing) continue;

      const seedSecret =
        purpose === 'access'
          ? this.config.get<string>('JWT_ACCESS_SECRET')
          : this.config.get<string>('JWT_REFRESH_SECRET');

      const secret = seedSecret && seedSecret.length > 0
        ? seedSecret
        : randomBytes(48).toString('base64');

      await this.repo.save(
        this.repo.create({
          kid: randomUUID(),
          purpose,
          secret,
          algorithm: 'HS256',
          status: 'active',
          retired_at: null,
        }),
      );
      this.logger.log(`Bootstrap JWT key cho purpose=${purpose}`);
    }
    this.invalidateCache();
  }

  // Load toàn bộ key dùng được (active + retiring) cho một purpose, cache 60s
  async loadRing(purpose: JwtKeyPurpose): Promise<JwtKey[]> {
    const hit = this.cache.get(purpose);
    if (hit && hit.exp > Date.now()) return hit.keys;

    const keys = await this.repo
      .createQueryBuilder('k')
      .where('k.purpose = :purpose', { purpose })
      .andWhere('k.status IN (:...statuses)', {
        statuses: ['active', 'retiring'],
      })
      .getMany();

    // Lọc retiring đã hết grace period
    const now = Date.now();
    const usable = keys.filter((k) => {
      if (k.status === 'active') return true;
      return k.retired_at && k.retired_at.getTime() > now;
    });

    this.cache.set(purpose, { keys: usable, exp: Date.now() + this.CACHE_TTL_MS });
    return usable;
  }

  invalidateCache(purpose?: JwtKeyPurpose) {
    if (purpose) this.cache.delete(purpose);
    else this.cache.clear();
  }

  // Key để sign (active)
  async signingKey(purpose: JwtKeyPurpose): Promise<JwtKey> {
    const ring = await this.loadRing(purpose);
    const active = ring.find((k) => k.status === 'active');
    if (!active) {
      throw new Error(`Không có JWT key active cho purpose=${purpose}`);
    }
    return active;
  }

  // Key để verify (lookup bằng kid). Nếu không có kid (token legacy), fallback active.
  async verifyingKey(purpose: JwtKeyPurpose, kid?: string): Promise<JwtKey> {
    const ring = await this.loadRing(purpose);
    if (kid) {
      const found = ring.find((k) => k.kid === kid);
      if (!found) {
        throw new NotFoundException('JWT key không tồn tại hoặc đã hết hạn');
      }
      return found;
    }
    const active = ring.find((k) => k.status === 'active');
    if (!active) {
      throw new NotFoundException('Không có JWT key active');
    }
    this.logger.warn('Token không có kid — dùng active key (legacy fallback)');
    return active;
  }

  async rotate(purpose: JwtKeyPurpose): Promise<JwtKey> {
    if (!['access', 'refresh'].includes(purpose)) {
      throw new BadRequestException(`purpose không hợp lệ: ${purpose}`);
    }

    const lifetimeMs = this.lifetimeMs(purpose);
    const retiredAt = new Date(Date.now() + lifetimeMs);

    // Chuyển mọi key active hiện tại sang retiring
    await this.repo
      .createQueryBuilder()
      .update(JwtKey)
      .set({ status: 'retiring' as JwtKeyStatus, retired_at: retiredAt })
      .where('purpose = :purpose AND status = :status', {
        purpose,
        status: 'active',
      })
      .execute();

    const newKey = await this.repo.save(
      this.repo.create({
        kid: randomUUID(),
        purpose,
        secret: randomBytes(48).toString('base64'),
        algorithm: 'HS256',
        status: 'active',
        retired_at: null,
      }),
    );

    this.invalidateCache(purpose);
    this.logger.log(`Rotated JWT key cho purpose=${purpose}, new kid=${newKey.kid}`);
    return newKey;
  }

  async findByKid(kid: string): Promise<JwtKey> {
    const key = await this.repo.findOne({ where: { kid } });
    if (!key) throw new NotFoundException('JWT key không tìm thấy');
    return key;
  }

  async listActive(purpose?: JwtKeyPurpose): Promise<JwtKey[]> {
    const qb = this.repo
      .createQueryBuilder('k')
      .where('k.status IN (:...statuses)', {
        statuses: ['active', 'retiring'],
      });
    if (purpose) qb.andWhere('k.purpose = :purpose', { purpose });
    return qb.getMany();
  }

  // Đưa key retiring đã quá grace period về retired; xoá retired cũ hơn 30 ngày
  async cleanupExpired(): Promise<{ retired: number; deleted: number }> {
    const now = new Date();
    const retireRes = await this.repo
      .createQueryBuilder()
      .update(JwtKey)
      .set({ status: 'retired' as JwtKeyStatus })
      .where('status = :st AND retired_at IS NOT NULL AND retired_at < :now', {
        st: 'retiring',
        now,
      })
      .execute();

    const oldDeletionThreshold = new Date(Date.now() - 30 * 864e5);
    const delRes = await this.repo.delete({
      status: 'retired',
      retired_at: LessThan(oldDeletionThreshold),
    });

    this.invalidateCache();
    return {
      retired: retireRes.affected ?? 0,
      deleted: delRes.affected ?? 0,
    };
  }
}
