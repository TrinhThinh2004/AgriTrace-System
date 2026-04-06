import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule }    from './modules/auth/auth.module';
import { UserModule }    from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { TraceModule }   from './modules/trace/trace.module';
import { MediaModule }   from './modules/media/media.module';
import { AuditModule }   from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    ProductModule,
    TraceModule,
    MediaModule,
    AuditModule,
  ],
  // Không có AppController/AppService — gateway chỉ expose các module routes
})
export class AppModule {}
