import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Role, UserStatus } from '@app/shared';

// ── gRPC request/response types (matched với user.proto) ──
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokensRequest {
  user_id: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────
  async register(dto: RegisterRequest) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      email: dto.email,
      password_hash: passwordHash,
      full_name: dto.full_name,
      phone: dto.phone,
      role: Role.FARMER,
      status: UserStatus.ACTIVE,
    });
    const savedUser = await this.userRepo.save(user);

    const profile = this.profileRepo.create({ user_id: savedUser.id });
    await this.profileRepo.save(profile);

    const tokens = await this.generateTokens(savedUser);
    await this.updateRefreshTokenHash(savedUser.id, tokens.refresh_token);

    return {
      ...tokens,
      user: this.sanitizeUser(savedUser),
    };
  }

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  async login(dto: LoginRequest) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên');
    }

    const isValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ─────────────────────────────────────────────
  // REFRESH TOKENS (Token Rotation)
  // ─────────────────────────────────────────────
  async refreshTokens(dto: RefreshTokensRequest) {
    const user = await this.userRepo.findOne({ where: { id: dto.user_id } });

    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const isTokenValid = await bcrypt.compare(dto.refresh_token, user.refresh_token_hash);
    if (!isTokenValid) {
      // Stolen token → revoke immediately
      await this.userRepo.update(dto.user_id, { refresh_token_hash: undefined });
      throw new UnauthorizedException('Refresh token không hợp lệ. Vui lòng đăng nhập lại');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  async logout(userId: string) {
    await this.userRepo.update(userId, { refresh_token_hash: undefined });
    return { message: 'Đăng xuất thành công' };
  }

  // ─────────────────────────────────────────────
  // GET PROFILE
  // ─────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    return this.sanitizeUser(user);
  }

  // ─────────────────────────────────────────────
  // GET USER BY ID (for internal service calls)
  // ─────────────────────────────────────────────
  async getUserById(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
    return this.sanitizeUser(user);
  }

  // ─────────────────────────────────────────────
  // VALIDATE TOKEN (for service-to-service auth)
  // ─────────────────────────────────────────────
  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      return {
        valid:   true,
        user_id: payload.sub   as string,
        email:   payload.email as string,
        role:    payload.role  as string,
      };
    } catch {
      return { valid: false, user_id: '', email: '', role: '' };
    }
  }

  // ═════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═════════════════════════════════════════════

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessExp  = this.configService.get<string>('JWT_ACCESS_EXPIRATION')  || '15m';
    const refreshExp = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExp as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExp as any,
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 12);
    await this.userRepo.update(userId, { refresh_token_hash: hash });
  }

  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, refresh_token_hash, ...safeUser } = user;
    return safeUser;
  }
}
