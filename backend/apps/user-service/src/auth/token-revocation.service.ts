import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '@app/shared';
import { RevokedAccessToken } from '../entities/revoked-token.entity';

@Injectable()
export class TokenRevocationService {
  private readonly logger = new Logger(TokenRevocationService.name);

  constructor(
    @InjectRepository(RevokedAccessToken)
    private readonly repo: Repository<RevokedAccessToken>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private key(jti: string): string {
    return `jti:${jti}`;
  }

  async revoke(jti: string, userId: string, expiresAt: Date): Promise<void> {
    if (!jti) return;
    // Nếu expired rồi thì bỏ qua
    if (expiresAt.getTime() < Date.now()) return;

    // Ghi DB (audit/persistence)
    try {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(RevokedAccessToken)
        .values({ jti, user_id: userId, expires_at: expiresAt })
        .orIgnore()
        .execute();
    } catch (err) {
      this.logger.warn(`Revoke jti=${jti} (DB) lỗi: ${(err as Error).message}`);
    }

    // Ghi Redis với TTL bằng đúng thời hạn token (PXAT = expire-at-millis)
    try {
      await this.redis.set(this.key(jti), '1', 'PXAT', expiresAt.getTime());
    } catch (err) {
      this.logger.warn(`Revoke jti=${jti} (Redis) lỗi: ${(err as Error).message}`);
    }
  }

  async isRevoked(jti: string): Promise<boolean> {
    if (!jti) return false;

    // Hot path: Redis EXISTS ~ms
    try {
      const hit = await this.redis.exists(this.key(jti));
      if (hit === 1) return true;
    } catch (err) {
      this.logger.warn(`isRevoked Redis lỗi (fallback DB): ${(err as Error).message}`);
    }

    // Cold path: fallback DB (cache miss hoặc Redis down)
    const row = await this.repo.findOne({ where: { jti } });
    if (!row) return false;

    // Warm Redis lại với TTL còn lại
    const ttlMs = row.expires_at.getTime() - Date.now();
    if (ttlMs > 0) {
      this.redis
        .set(this.key(jti), '1', 'PX', ttlMs)
        .catch((err) =>
          this.logger.warn(`Warm Redis lỗi: ${(err as Error).message}`),
        );
    }
    return true;
  }

  async cleanupExpired(): Promise<number> {
    // Redis tự expire keys; chỉ dọn DB cho gọn audit table
    const res = await this.repo.delete({ expires_at: LessThan(new Date()) });
    return res.affected ?? 0;
  }
}
