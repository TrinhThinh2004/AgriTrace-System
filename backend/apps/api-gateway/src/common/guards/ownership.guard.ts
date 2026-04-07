import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { Role } from '../enums';
import { OWNERSHIP_KEY, OwnershipMeta, IS_PUBLIC_KEY } from '../decorators';

interface ProductPolicyGrpc {
  checkFarmOwnership(data: {
    user_id: string;
    farm_id: string;
  }): Observable<{ allowed: boolean }>;

  checkBatchOwnership(data: {
    user_id: string;
    batch_id: string;
  }): Observable<{ allowed: boolean }>;
}

/**
 * ABAC guard — kiểm tra resource có thuộc về user hay không.
 * Chạy SAU JwtAuthGuard + RolesGuard(Admin bypass)
 */
@Injectable()
export class OwnershipGuard implements CanActivate, OnModuleInit {
  private policyService!: ProductPolicyGrpc;
  private cache = new Map<string, { allowed: boolean; exp: number }>();
  private readonly TTL_MS = 30_000;

  constructor(
    private readonly reflector: Reflector,
    @Inject('PRODUCT_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.policyService =
      this.client.getService<ProductPolicyGrpc>('ProductService');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Public 
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const meta = this.reflector.getAllAndOverride<OwnershipMeta>(OWNERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!meta) return true; 

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Thiếu thông tin người dùng');

    // ADMIN bypass
    if (user.role === Role.ADMIN) return true;

    const resourceId = req.params?.[meta.paramName];
    if (!resourceId) {
      throw new BadRequestException(
        `Thiếu route param "${meta.paramName}" cho ownership check`,
      );
    }

    const cacheKey = `${user.id}:${meta.resource}:${resourceId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.exp > Date.now()) {
      if (!cached.allowed) throw new ForbiddenException('Không có quyền trên tài nguyên này');
      return true;
    }

    let allowed = false;
    if (meta.resource === 'farm') {
      const res = await firstValueFrom(
        this.policyService.checkFarmOwnership({
          user_id: user.id,
          farm_id: resourceId,
        }),
      );
      allowed = res.allowed;
    } else if (meta.resource === 'batch') {
      const res = await firstValueFrom(
        this.policyService.checkBatchOwnership({
          user_id: user.id,
          batch_id: resourceId,
        }),
      );
      allowed = res.allowed;
    }

    this.cache.set(cacheKey, { allowed, exp: Date.now() + this.TTL_MS });

    if (!allowed) {
      throw new ForbiddenException('Không có quyền trên tài nguyên này');
    }
    return true;
  }
}
