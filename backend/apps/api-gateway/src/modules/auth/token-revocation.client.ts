import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface UserServiceGrpc {
  isAccessTokenRevoked(data: { jti: string }): Observable<{ value: boolean }>;
  revokeAccessToken(data: {
    jti: string;
    user_id: string;
    expires_at: number;
  }): Observable<{ message: string }>;
}

@Injectable()
export class TokenRevocationClient implements OnModuleInit {
  private readonly logger = new Logger(TokenRevocationClient.name);
  private userService!: UserServiceGrpc;

  private cache = new Map<string, { revoked: boolean; exp: number }>();
  private readonly CACHE_TTL_MS = 30_000;

  constructor(
    @Inject('USER_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
  }

  async isRevoked(jti: string): Promise<boolean> {
    if (!jti) return false;

    const cached = this.cache.get(jti);
    if (cached && cached.exp > Date.now()) return cached.revoked;

    try {
      const res = await firstValueFrom(
        this.userService.isAccessTokenRevoked({ jti }),
      );
      const revoked = !!res.value;
      this.cache.set(jti, { revoked, exp: Date.now() + this.CACHE_TTL_MS });
      return revoked;
    } catch (err) {
      this.logger.warn(`isRevoked(${jti}) lỗi: ${(err as Error).message}`);
      return false;
    }
  }

  async revoke(jti: string, userId: string, expiresAt: number): Promise<void> {
    if (!jti) return;
    try {
      await firstValueFrom(
        this.userService.revokeAccessToken({
          jti,
          user_id: userId,
          expires_at: expiresAt,
        }),
      );
      this.cache.set(jti, { revoked: true, exp: Date.now() + this.CACHE_TTL_MS });
    } catch (err) {
      this.logger.warn(`revokeAccessToken(${jti}) lỗi: ${(err as Error).message}`);
    }
  }
}
