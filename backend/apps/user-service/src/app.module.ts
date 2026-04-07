import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Config TypeORM connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get<string>('USER_DB_HOST'),
        port:     parseInt(config.get<string>('USER_DB_PORT') || '5432', 10),
        username: config.get<string>('USER_DB_USER'),
        password: config.get<string>('USER_DB_PASS'),
        database: config.get<string>('USER_DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // dùng migration trong production
        logging: ['error'],
      }),
    }),

    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
