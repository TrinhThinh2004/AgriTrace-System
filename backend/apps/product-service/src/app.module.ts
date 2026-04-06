import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';
import { HealthController } from './health.controller';

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

    ProductModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
