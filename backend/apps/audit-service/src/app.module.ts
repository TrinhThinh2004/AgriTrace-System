import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AuditModule } from './audit/audit.module';
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

    AuditModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: GrpcAuthInterceptor },
    { provide: APP_FILTER, useClass: GrpcExceptionFilter },
  ],
})
export class AppModule {}
