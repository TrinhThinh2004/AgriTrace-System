import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Định nghĩa interface cho gRPC client của User Service(phải đồng bộ với user.proto)
interface UserServiceGrpc {
  register(data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }): Observable<any>;

  login(data: {
    email: string;
    password: string;
  }): Observable<any>;

  refreshTokens(data: {
    user_id: string;
    refresh_token: string;
  }): Observable<any>;

  logout(data: { user_id: string }): Observable<any>;

  getProfile(data: { user_id: string }): Observable<any>;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private userService!: UserServiceGrpc;

  constructor(
    @Inject('USER_SERVICE')
    private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
  }

  // Proxy các method gọi đến User Service qua gRPC

  async register(dto: RegisterDto) {
    return firstValueFrom(
      this.userService.register({
        email:     dto.email,
        password:  dto.password,
        full_name: dto.full_name,
        phone:     dto.phone,
      }),
    );
  }

  async login(dto: LoginDto) {
    return firstValueFrom(
      this.userService.login({
        email:    dto.email,
        password: dto.password,
      }),
    );
  }

  async refreshTokens(userId: string, refreshToken: string) {
    return firstValueFrom(
      this.userService.refreshTokens({
        user_id:       userId,
        refresh_token: refreshToken,
      }),
    );
  }

  async logout(userId: string) {
    return firstValueFrom(
      this.userService.logout({ user_id: userId }),
    );
  }

  async getProfile(userId: string) {
    return firstValueFrom(
      this.userService.getProfile({ user_id: userId }),
    );
  }
}
