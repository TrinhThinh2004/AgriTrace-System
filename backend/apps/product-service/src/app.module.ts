import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RABBIT_EXCHANGE, RABBIT_DLX } from '@app/shared';
import { CropCategoryModule } from './crop-category/crop-category.module';
import { FarmModule } from './farm/farm.module';
import { BatchModule } from './batch/batch.module';
import { CertificationModule } from './certification/certification.module';
import { HealthController } from './health.controller';
import { GrpcAuthInterceptor } from './common/grpc-auth.interceptor';
import { GrpcExceptionFilter } from './common/grpc-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Cấu hình kết nối database PostgreSQL với TypeORM của product-service
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
        synchronize: true, 
        logging: ['error'],
      }),
    }),

    {
      // global: true để AmqpConnection inject được ở mọi feature module con (FarmService, ...)
      ...RabbitMQModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          uri: config.getOrThrow<string>('RABBITMQ_URL'),
          exchanges: [
            { name: RABBIT_EXCHANGE, type: 'topic' },
            { name: RABBIT_DLX, type: 'topic' },
          ],
          connectionInitOptions: { wait: false },
        }),
      }),
      global: true,
    },

    CropCategoryModule,
    FarmModule,
    BatchModule,
    CertificationModule,
  ],
  controllers: [HealthController],
  providers: [
    // Đọc x-user-id / x-user-role từ gRPC metadata, gắn vào payload (__auth)
    { provide: APP_INTERCEPTOR, useClass: GrpcAuthInterceptor },
    { provide: APP_FILTER, useClass: GrpcExceptionFilter },
  ],
})
export class AppModule {}
