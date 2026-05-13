import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RedisModule, RABBIT_EXCHANGE, RABBIT_DLX } from '@app/shared';
import { AuthModule } from './auth/auth.module';
import { KeyModule } from './keys/key.module';
import { NotificationModule } from './notification/notification.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    {
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
    KeyModule,
    NotificationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

