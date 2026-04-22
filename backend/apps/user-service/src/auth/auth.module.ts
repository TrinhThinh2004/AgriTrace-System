import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { UserKey } from '../entities/user-key.entity';
import { JwtKey } from '../entities/jwt-key.entity';
import { RevokedAccessToken } from '../entities/revoked-token.entity';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtKeyService } from './jwt-key.service';
import { TokenRevocationService } from './token-revocation.service';
import { JwtRotationCron } from './jwt-rotation.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, UserKey, JwtKey, RevokedAccessToken]),
    JwtModule.register({}),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtKeyService, TokenRevocationService, JwtRotationCron],
  exports: [AuthService, JwtKeyService, TokenRevocationService],
})
export class AuthModule implements OnApplicationBootstrap {
  constructor(private readonly jwtKeyService: JwtKeyService) {}

  // Bootstrap JWT key ring lần đầu (nếu bảng rỗng)
  async onApplicationBootstrap() {
    await this.jwtKeyService.ensureBootstrap();
  }
}
