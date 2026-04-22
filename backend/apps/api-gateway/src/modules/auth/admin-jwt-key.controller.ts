import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  Query,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { AdminOnly } from '../../common/decorators';
import { GatewayJwtKeyService } from './gateway-jwt-key.service';

interface JwtKeyDto {
  kid: string;
  purpose: 'access' | 'refresh';
  secret: string;
  algorithm: string;
  status: string;
  created_at: string;
  retired_at: string;
}

interface UserServiceGrpc {
  rotateJwtKey(data: { purpose: string }): Observable<JwtKeyDto>;
  listActiveJwtKeys(data: { purpose?: string }): Observable<{ items: JwtKeyDto[] }>;
}

function safeJwtKey(k: JwtKeyDto) {
  const { secret, ...rest } = k;
  void secret;
  return rest;
}

@Controller('admin/jwt-keys')
export class AdminJwtKeyController implements OnModuleInit {
  private userService!: UserServiceGrpc;

  constructor(
    @Inject('USER_SERVICE') private readonly client: ClientGrpc,
    private readonly gatewayKeyService: GatewayJwtKeyService,
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
  }

  @AdminOnly()
  @Get()
  async list(@Query('purpose') purpose?: string) {
    const res = await firstValueFrom(
      this.userService.listActiveJwtKeys({ purpose: purpose ?? '' }),
    );
    return { items: (res.items ?? []).map(safeJwtKey) };
  }

  @AdminOnly()
  @Post('rotate')
  async rotate(@Body() body: { purpose: 'access' | 'refresh' }) {
    if (!body?.purpose || !['access', 'refresh'].includes(body.purpose)) {
      throw new BadRequestException('purpose phải là "access" hoặc "refresh"');
    }
    const key = await firstValueFrom(
      this.userService.rotateJwtKey({ purpose: body.purpose }),
    );
    // Làm ấm cache gateway ngay với key mới + đánh xoá cache cũ
    this.gatewayKeyService.invalidate();
    await this.gatewayKeyService.warmup(body.purpose);
    return safeJwtKey(key);
  }
}
