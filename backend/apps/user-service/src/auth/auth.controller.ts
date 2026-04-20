import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';


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
  constructor(private readonly authService: AuthService) {}

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

  // rpc Logout
  @GrpcMethod('UserService', 'Logout')
  async logout(data: { user_id: string }) {
    return this.authService.logout(data.user_id);
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
}

