import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { REDIS_CLIENT, RedisModule } from '@app/shared';
import type Redis from 'ioredis';
import { GrpcToHttpExceptionFilter } from './common/filters/grpc-to-http-exception.filter';

import { AuthModule }    from './modules/auth/auth.module';
import { UserModule }    from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { TraceModule }   from './modules/trace/trace.module';
import { MediaModule }   from './modules/media/media.module';
import { AuditModule }   from './modules/audit/audit.module';

import { JwtAuthGuard, RolesGuard, OwnershipGuard } from './common/guards';
import { PolicyModule } from './common/policy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, REDIS_CLIENT],
      useFactory: (config: ConfigService, redis: Redis) => ({
        throttlers: [
          {
            ttl: parseInt(config.get<string>('RATE_LIMIT_TTL_MS') ?? '60000', 10),
            limit: parseInt(config.get<string>('RATE_LIMIT_MAX') ?? '100', 10),
          },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    PolicyModule,
    AuthModule,
    UserModule,
    ProductModule,
    TraceModule,
    MediaModule,
    AuditModule,
  ],
  providers: [
    // Rate limiting (chạy TRƯỚC JwtAuthGuard để chặn sớm brute-force)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Middleware toàn cục: kiểm tra JWT hợp lệ (trừ @Public() endpoints)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // RBAC: kiểm tra @Roles() / @AdminOnly()… ADMIN bypass mọi role check.
    { provide: APP_GUARD, useClass: RolesGuard },
    // ABAC: kiểm tra ownership theo @OwnsFarm() / @OwnsBatch().
    { provide: APP_GUARD, useClass: OwnershipGuard },
    // Chuyển gRPC errors từ microservices → HTTP response codes
    { provide: APP_FILTER, useClass: GrpcToHttpExceptionFilter },
  ],
})
export class AppModule {}
