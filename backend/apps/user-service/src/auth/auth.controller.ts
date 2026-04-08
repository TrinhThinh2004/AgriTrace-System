import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';


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
        user: {
          id:         result.user.id,
          email:      result.user.email,
          full_name:  result.user.full_name,
          role:       result.user.role,
          status:     result.user.status,
          phone:      result.user.phone ?? '',
          created_at: result.user.created_at?.toISOString() ?? '',
        },
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
        user: {
          id:         result.user.id,
          email:      result.user.email,
          full_name:  result.user.full_name,
          role:       result.user.role,
          status:     result.user.status,
          phone:      result.user.phone ?? '',
          created_at: result.user.created_at?.toISOString() ?? '',
        },
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
    return {
      id:         user.id,
      email:      user.email,
      full_name:  user.full_name,
      role:       user.role,
      status:     user.status,
      phone:      user.phone ?? '',
      created_at: user.created_at?.toISOString() ?? '',
    };
  }

  // rpc GetUserById
  @GrpcMethod('UserService', 'GetUserById')
  async getUserById(data: { user_id: string }) {
    const user = await this.authService.getUserById(data.user_id);
    return {
      id:         user.id,
      email:      user.email,
      full_name:  user.full_name,
      role:       user.role,
      status:     user.status,
      phone:      user.phone ?? '',
      created_at: user.created_at?.toISOString() ?? '',
    };
  }

  // rpc ValidateToken
  @GrpcMethod('UserService', 'ValidateToken')
  async validateToken(data: { token: string }) {
    return this.authService.validateToken(data.token);
  }
}

