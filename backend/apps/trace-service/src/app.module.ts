import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TraceModule } from './trace/trace.module';
import { HealthController } from './health.controller';
import { GrpcAuthInterceptor } from './common/grpc-auth.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Cấu hình kết nối database với TypeORM của trace-service 
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get<string>('TRACE_DB_HOST'),
        port:     parseInt(config.get<string>('TRACE_DB_PORT') || '5432', 10),
        username: config.get<string>('TRACE_DB_USER'),
        password: config.get<string>('TRACE_DB_PASS'),
        database: config.get<string>('TRACE_DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, 
        logging: ['error'],
      }),
    }),

    TraceModule,
  ],
  controllers: [HealthController],
  providers: [
    // Đọc x-user-id / x-user-role từ gRPC metadata, gắn vào payload (__auth)
    { provide: APP_INTERCEPTOR, useClass: GrpcAuthInterceptor },
  ],
})
export class AppModule {}
