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

// Dto cho các request gRPC 
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

  // Register method 
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

  // Login method
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

  // Refresh tokens method
  async refreshTokens(dto: RefreshTokensRequest) {
    const user = await this.userRepo.findOne({ where: { id: dto.user_id } });

    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const isTokenValid = await bcrypt.compare(dto.refresh_token, user.refresh_token_hash);
    if (!isTokenValid) {
      // Nếu refresh token không hợp lệ thì sẽ xóa hash trong database
      await this.userRepo.update(dto.user_id, { refresh_token_hash: undefined });
      throw new UnauthorizedException('Refresh token không hợp lệ. Vui lòng đăng nhập lại');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  // Logout method
  async logout(userId: string) {
    await this.userRepo.update(userId, { refresh_token_hash: undefined });
    return { message: 'Đăng xuất thành công' };
  }

  // Get profile method
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

  // Get user by ID 
  async getUserById(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
    return this.sanitizeUser(user);
  }

  // ── CRUD Methods for Admin ──
  async listUsers({ role, page = 1, limit = 50 }: { role?: string; page?: number; limit?: number }) {
    const [users, total] = await this.userRepo.findAndCount({
      where: role ? { role: role as Role } : {},
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return {
      items: users.map(u => ({
        ...this.sanitizeUser(u),
        phone: u.phone ?? '',
        created_at: u.created_at.toISOString(),
      })),
      pagination: { page, limit, total },
    };
  }

  async createUser(dto: any) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email đã tồn tại');

    const passwordHash = await bcrypt.hash(dto.password || '123456', 12);
    const user = this.userRepo.create({
      email: dto.email,
      password_hash: passwordHash,
      full_name: dto.full_name,
      phone: dto.phone,
      role: dto.role || Role.FARMER,
      status: UserStatus.ACTIVE,
    });
    const saved = await this.userRepo.save(user);
    await this.profileRepo.save(this.profileRepo.create({ user_id: saved.id }));
    return saved;
  }

  async updateUser(id: string, dto: any) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('Không tìm thấy user');
    if (dto.full_name) user.full_name = dto.full_name;
    if (dto.phone) user.phone = dto.phone;
    if (dto.role) user.role = dto.role;
    if (dto.status) user.status = dto.status;
    return this.userRepo.save(user);
  }

  async deleteUser(id: string) {
    // In real app, consider soft delete instead
    await this.userRepo.delete(id);
    return { message: 'Đã xóa người dùng' };
  }

//  Validate token method (dành cho API Gateway khi nhận JWT từ client)
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

  // Helper methods
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
  // Rotation của refresh token: 
  // mỗi lần dùng refresh token để lấy access token mới thì sẽ tạo một refresh token mới luôn,
  // và hash của nó sẽ được lưu vào database. 

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 12);
    await this.userRepo.update(userId, { refresh_token_hash: hash });
  }
  // sanitizeUser sẽ loại bỏ các trường nhạy cảm 
  // trước khi trả về thông tin user
  private sanitizeUser(user: User) {
    const { password_hash, refresh_token_hash, ...safeUser } = user;
    return safeUser;
  }
}
