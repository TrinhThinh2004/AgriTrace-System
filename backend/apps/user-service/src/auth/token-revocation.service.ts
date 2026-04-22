import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RevokedAccessToken } from '../entities/revoked-token.entity';

@Injectable()
export class TokenRevocationService {
  private readonly logger = new Logger(TokenRevocationService.name);
  private hitCache = new Map<string, { revoked: boolean; exp: number }>();
  private readonly CACHE_TTL_MS = 30_000;

  constructor(
    @InjectRepository(RevokedAccessToken)
    private readonly repo: Repository<RevokedAccessToken>,
  ) {}

  async revoke(jti: string, userId: string, expiresAt: Date): Promise<void> {
    if (!jti) return;
    // Nếu expired rồi thì bỏ qua
    if (expiresAt.getTime() < Date.now()) return;

    try {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(RevokedAccessToken)
        .values({ jti, user_id: userId, expires_at: expiresAt })
        .orIgnore()
        .execute();
    } catch (err) {
      this.logger.warn(`Revoke jti=${jti} lỗi: ${(err as Error).message}`);
    }

    this.hitCache.set(jti, { revoked: true, exp: Date.now() + this.CACHE_TTL_MS });
  }

  async isRevoked(jti: string): Promise<boolean> {
    if (!jti) return false;

    const cached = this.hitCache.get(jti);
    if (cached && cached.exp > Date.now()) return cached.revoked;

    const row = await this.repo.findOne({ where: { jti } });
    const revoked = !!row;
    this.hitCache.set(jti, { revoked, exp: Date.now() + this.CACHE_TTL_MS });
    return revoked;
  }

  async cleanupExpired(): Promise<number> {
    const res = await this.repo.delete({ expires_at: LessThan(new Date()) });
    // Dọn cache cho gọn
    if ((res.affected ?? 0) > 0) this.hitCache.clear();
    return res.affected ?? 0;
  }
}
