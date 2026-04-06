import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TraceModule } from './trace/trace.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Database riêng cho trace-service ──────────────────────
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
        synchronize: true, // → dùng migration trong production
        logging: ['error'],
      }),
    }),

    TraceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
