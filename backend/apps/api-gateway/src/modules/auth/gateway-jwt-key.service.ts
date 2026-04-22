import {
  Injectable,
  Inject,
  OnModuleInit,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

export type JwtKeyPurpose = 'access' | 'refresh';

interface JwtKeyDto {
  kid: string;
  purpose: JwtKeyPurpose;
  secret: string;
  algorithm: string;
  status: 'active' | 'retiring' | 'retired';
  created_at: string;
  retired_at: string;
}

interface UserServiceGrpc {
  getJwtKey(data: { kid: string }): Observable<JwtKeyDto>;
  listActiveJwtKeys(data: { purpose?: string }): Observable<{ items: JwtKeyDto[] }>;
}

@Injectable()
export class GatewayJwtKeyService implements OnModuleInit {
  private readonly logger = new Logger(GatewayJwtKeyService.name);
  private userService!: UserServiceGrpc;

  private cache = new Map<string, { secret: string; exp: number }>();
  private readonly CACHE_TTL_MS = 60_000;

  constructor(
    @Inject('USER_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
  }

  // Lấy secret theo kid; fallback cache miss → gọi gRPC GetJwtKey
  async getSecret(kid: string): Promise<string> {
    if (!kid) throw new UnauthorizedException('Token thiếu kid header');

    const hit = this.cache.get(kid);
    if (hit && hit.exp > Date.now()) return hit.secret;

    try {
      const key = await firstValueFrom(this.userService.getJwtKey({ kid }));
      if (!key || !key.secret) {
        throw new UnauthorizedException('JWT key không tồn tại');
      }
      if (key.status === 'retired') {
        throw new UnauthorizedException('JWT key đã hết hạn');
      }
      // Key retiring nhưng đã qua retired_at → coi như hết hạn
      if (key.status === 'retiring' && key.retired_at) {
        const retiredAt = new Date(key.retired_at).getTime();
        if (retiredAt > 0 && retiredAt < Date.now()) {
          throw new UnauthorizedException('JWT key đã hết hạn');
        }
      }
      this.cache.set(kid, { secret: key.secret, exp: Date.now() + this.CACHE_TTL_MS });
      return key.secret;
    } catch (err) {
      this.logger.warn(`GetJwtKey(${kid}) lỗi: ${(err as Error).message}`);
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  // Preload toàn bộ key active + retiring cho một purpose (gọi khi bootstrap)
  async warmup(purpose?: JwtKeyPurpose): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.userService.listActiveJwtKeys({ purpose: purpose ?? '' }),
      );
      for (const k of res.items ?? []) {
        if (k.status !== 'retired') {
          this.cache.set(k.kid, {
            secret: k.secret,
            exp: Date.now() + this.CACHE_TTL_MS,
          });
        }
      }
      this.logger.log(`Warmed up ${res.items?.length ?? 0} JWT keys (purpose=${purpose ?? 'all'})`);
    } catch (err) {
      this.logger.warn(`warmup JWT keys lỗi: ${(err as Error).message}`);
    }
  }

  invalidate(kid?: string) {
    if (kid) this.cache.delete(kid);
    else this.cache.clear();
  }
}
