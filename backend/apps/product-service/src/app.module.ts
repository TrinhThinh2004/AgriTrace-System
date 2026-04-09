import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CropCategoryModule } from './crop-category/crop-category.module';
import { FarmModule } from './farm/farm.module';
import { BatchModule } from './batch/batch.module';
import { HealthController } from './health.controller';
import { GrpcAuthInterceptor } from './common/grpc-auth.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Database riêng cho product-service ────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get<string>('PRODUCT_DB_HOST'),
        port:     parseInt(config.get<string>('PRODUCT_DB_PORT') || '5432', 10),
        username: config.get<string>('PRODUCT_DB_USER'),
        password: config.get<string>('PRODUCT_DB_PASS'),
        database: config.get<string>('PRODUCT_DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // → dùng migration trong production
        logging: ['error'],
      }),
    }),

    CropCategoryModule,
    FarmModule,
    BatchModule,
  ],
  controllers: [HealthController],
  providers: [
    // Đọc x-user-id / x-user-role từ gRPC metadata, gắn vào payload (__auth)
    { provide: APP_INTERCEPTOR, useClass: GrpcAuthInterceptor },
  ],
})
export class AppModule {}
