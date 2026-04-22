import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GatewayJwtKeyService } from './gateway-jwt-key.service';
import { TokenRevocationClient } from './token-revocation.client';
import { AdminJwtKeyController } from './admin-jwt-key.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT Module đăng ký tạm thời
    JwtModule.register({}),

    // GRPC Client để kết nối với User Service
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: config.get<string>('USER_SERVICE_GRPC_URL') || 'localhost:50051',
            package: 'user',
            protoPath: join(process.cwd(), 'libs/shared/proto/user.proto'),
            loader: { keepCase: true },
          },
        }),
      },
    ]),
  ],
  controllers: [AuthController, AdminJwtKeyController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    GatewayJwtKeyService,
    TokenRevocationClient,
  ],
  exports: [AuthService, GatewayJwtKeyService, TokenRevocationClient],
})
export class AuthModule implements OnApplicationBootstrap {
  constructor(private readonly jwtKeyService: GatewayJwtKeyService) {}

  async onApplicationBootstrap() {
    // Preload toàn bộ key active + retiring để tránh miss lần đầu
    await this.jwtKeyService.warmup();
  }
}
