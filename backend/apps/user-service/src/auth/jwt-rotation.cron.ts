import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JwtKeyService } from './jwt-key.service';
import { TokenRevocationService } from './token-revocation.service';

@Injectable()
export class JwtRotationCron {
  private readonly logger = new Logger(JwtRotationCron.name);

  constructor(
    private readonly jwtKeyService: JwtKeyService,
    private readonly tokenRevocation: TokenRevocationService,
  ) {}

  // Rotate access key mỗi 7 ngày (giữa đêm Chủ Nhật)
  @Cron(CronExpression.EVERY_WEEK)
  async rotateAccessKey() {
    try {
      const key = await this.jwtKeyService.rotate('access');
      this.logger.log(`[CRON] Rotated access key → kid=${key.kid}`);
    } catch (err) {
      this.logger.error(`[CRON] rotateAccessKey lỗi: ${(err as Error).message}`);
    }
  }

  // Rotate refresh key mỗi tháng (1h sáng ngày 1)
  @Cron('0 1 1 * *')
  async rotateRefreshKey() {
    try {
      const key = await this.jwtKeyService.rotate('refresh');
      this.logger.log(`[CRON] Rotated refresh key → kid=${key.kid}`);
    } catch (err) {
      this.logger.error(`[CRON] rotateRefreshKey lỗi: ${(err as Error).message}`);
    }
  }

  // Cleanup key retired quá hạn + blacklist token hết hạn, chạy mỗi giờ
  @Cron(CronExpression.EVERY_HOUR)
  async cleanup() {
    try {
      const keys = await this.jwtKeyService.cleanupExpired();
      const revoked = await this.tokenRevocation.cleanupExpired();
      if (keys.retired || keys.deleted || revoked) {
        this.logger.log(
          `[CRON] Cleanup: keys retired=${keys.retired} deleted=${keys.deleted}, revoked_tokens deleted=${revoked}`,
        );
      }
    } catch (err) {
      this.logger.error(`[CRON] cleanup lỗi: ${(err as Error).message}`);
    }
  }
}
