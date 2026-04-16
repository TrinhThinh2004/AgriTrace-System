import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
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
    PolicyModule,
    AuthModule,
    UserModule,
    ProductModule,
    TraceModule,
    MediaModule,
    AuditModule,
  ],
  providers: [
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
