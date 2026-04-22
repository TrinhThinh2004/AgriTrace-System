import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { JwtKeyService } from './jwt-key.service';
import { TokenRevocationService } from './token-revocation.service';
import { JwtKey, JwtKeyPurpose } from '../entities/jwt-key.entity';

function toJwtKeyResponse(k: JwtKey) {
  return {
    kid:        k.kid,
    purpose:    k.purpose,
    secret:     k.secret,
    algorithm:  k.algorithm,
    status:     k.status,
    created_at: k.created_at?.toISOString?.() ?? '',
    retired_at: k.retired_at?.toISOString?.() ?? '',
  };
}


type UserLike = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  phone?: string | null;
  created_at?: Date | null;
  avatar_url?: string | null;
  address?: string | null;
  bio?: string | null;
};

function toUserResponse(user: UserLike) {
  return {
    id:         user.id,
    email:      user.email,
    full_name:  user.full_name,
    role:       user.role,
    status:     user.status,
    phone:      user.phone ?? '',
    created_at: user.created_at?.toISOString() ?? '',
    avatar_url: user.avatar_url ?? '',
    address:    user.address ?? '',
    bio:        user.bio ?? '',
  };
}

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtKeyService: JwtKeyService,
    private readonly tokenRevocation: TokenRevocationService,
  ) {}

  // rpc Register
  @GrpcMethod('UserService', 'Register')
  async register(data: { email: string; password: string; full_name: string; phone?: string }) {
    try {
      const result = await this.authService.register(data);
      return {
        access_token:  result.access_token,
        refresh_token: result.refresh_token,
        user: toUserResponse(result.user as UserLike),
      };
    } catch (error) {
      console.error('[User Service] Error in Register:', error);
      throw error;
    }
  }

  // rpc Login
  @GrpcMethod('UserService', 'Login')
  async login(data: { email: string; password: string }) {
    try {
      const result = await this.authService.login(data);
      return {
        access_token:  result.access_token,
        refresh_token: result.refresh_token,
        user: toUserResponse(result.user as UserLike),
      };
    } catch (error) {
      console.error('[User Service] Error in Login:', error);
      throw error;
    }
  }

  // rpc RefreshTokens
  @GrpcMethod('UserService', 'RefreshTokens')
  async refreshTokens(data: { user_id: string; refresh_token: string }) {
    return this.authService.refreshTokens({
      user_id: data.user_id,
      refresh_token: data.refresh_token,
    });
  }

  // rpc Logout — nhận thêm jti + exp để blacklist access token
  @GrpcMethod('UserService', 'Logout')
  async logout(data: { user_id: string; jti?: string; exp?: number }) {
    return this.authService.logout(data.user_id, data.jti, data.exp);
  }

  // rpc GetProfile
  @GrpcMethod('UserService', 'GetProfile')
  async getProfile(data: { user_id: string }) {
    const user = await this.authService.getProfile(data.user_id);
    return toUserResponse(user as UserLike);
  }

  // rpc GetUserById
  @GrpcMethod('UserService', 'GetUserById')
  async getUserById(data: { user_id: string }) {
    const user = await this.authService.getUserById(data.user_id);
    return toUserResponse(user as UserLike);
  }

  // rpc ListUsers
  @GrpcMethod('UserService', 'ListUsers')
  async listUsers(data: { role?: string; page?: number; limit?: number }) {
    return this.authService.listUsers(data);
  }

  // rpc CreateUser
  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: { email: string; password?: string; full_name: string; phone?: string; role: string }) {
    const user = await this.authService.createUser(data);
    return toUserResponse(user as UserLike);
  }

  // rpc UpdateUser
  @GrpcMethod('UserService', 'UpdateUser')
  async updateUser(data: { id: string; full_name?: string; phone?: string; role?: string; status?: string }) {
    const user = await this.authService.updateUser(data.id, data);
    return toUserResponse(user as UserLike);
  }

  // rpc UpdateProfile
  @GrpcMethod('UserService', 'UpdateProfile')
  async updateProfile(data: {
    user_id: string;
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    address?: string;
    bio?: string;
  }) {
    const user = await this.authService.updateProfile(data.user_id, data);
    return toUserResponse(user as UserLike);
  }

  // rpc DeleteUser
  @GrpcMethod('UserService', 'DeleteUser')
  async deleteUser(data: { id: string }) {
    return this.authService.deleteUser(data.id);
  }

  // rpc ValidateToken
  @GrpcMethod('UserService', 'ValidateToken')
  async validateToken(data: { token: string }) {
    return this.authService.validateToken(data.token);
  }

  // ── JWT Key Ring RPCs ─────────────────────────────────────────────
  @GrpcMethod('UserService', 'RotateJwtKey')
  async rotateJwtKey(data: { purpose: string }) {
    const key = await this.jwtKeyService.rotate(data.purpose as JwtKeyPurpose);
    return toJwtKeyResponse(key);
  }

  @GrpcMethod('UserService', 'GetJwtKey')
  async getJwtKey(data: { kid: string }) {
    const key = await this.jwtKeyService.findByKid(data.kid);
    return toJwtKeyResponse(key);
  }

  @GrpcMethod('UserService', 'ListActiveJwtKeys')
  async listActiveJwtKeys(data: { purpose?: string }) {
    const purpose = (data.purpose || undefined) as JwtKeyPurpose | undefined;
    const keys = await this.jwtKeyService.listActive(purpose);
    return { items: keys.map(toJwtKeyResponse) };
  }

  // ── Access Token Blacklist RPCs ───────────────────────────────────
  @GrpcMethod('UserService', 'RevokeAccessToken')
  async revokeAccessToken(data: { jti: string; user_id: string; expires_at: number }) {
    await this.tokenRevocation.revoke(
      data.jti,
      data.user_id,
      new Date(Number(data.expires_at) * 1000),
    );
    return { message: 'Đã thu hồi access token' };
  }

  @GrpcMethod('UserService', 'IsAccessTokenRevoked')
  async isAccessTokenRevoked(data: { jti: string }) {
    const value = await this.tokenRevocation.isRevoked(data.jti);
    return { value };
  }
}

