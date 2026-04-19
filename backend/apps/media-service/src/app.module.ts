import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetModule } from './asset/asset.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('MEDIA_DB_HOST'),
        port: parseInt(config.get<string>('MEDIA_DB_PORT') || '5432', 10),
        username: config.get<string>('MEDIA_DB_USER'),
        password: config.get<string>('MEDIA_DB_PASS'),
        database: config.get<string>('MEDIA_DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        logging: ['error'],
      }),
    }),

    CloudinaryModule,
    AssetModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
