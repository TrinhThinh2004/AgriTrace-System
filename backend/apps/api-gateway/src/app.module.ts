import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

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
  ],
})
export class AppModule {}
