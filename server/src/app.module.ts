import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature Modules
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { TraceModule } from './modules/trace/trace.module';
import { MediaModule } from './modules/media/media.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true, // Tự động load entities từ các module
        synchronize: true,  // 
        // logging: true,
        logging: ['error'],
      }),
    }),

    // ── Register all feature modules ──
    UserModule,
    ProductModule,
    TraceModule,
    MediaModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
