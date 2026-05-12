import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RABBIT_EXCHANGE, RABBIT_DLX } from '@app/shared';
import { AuditModule } from './audit/audit.module';
import { AnchorModule } from './anchor/anchor.module';
import { HealthController } from './health.controller';
import { GrpcAuthInterceptor } from './common/grpc-auth.interceptor';
import { GrpcExceptionFilter } from './common/grpc-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get<string>('AUDIT_DB_HOST') || 'localhost',
        port:     parseInt(config.get<string>('AUDIT_DB_PORT') || '5437', 10),
        username: config.get<string>('AUDIT_DB_USER') || 'audit_admin',
        password: config.get<string>('AUDIT_DB_PASS') || 'audit_pass123',
        database: config.get<string>('AUDIT_DB_NAME') || 'agritrace_audit',
        autoLoadEntities: true,
        synchronize: true,
        logging: ['error'],
      }),
    }),

    ScheduleModule.forRoot(),

    RabbitMQModule.forRootAsync({
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

    AuditModule,
    AnchorModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: GrpcAuthInterceptor },
    { provide: APP_FILTER, useClass: GrpcExceptionFilter },
  ],
})
export class AppModule {}
