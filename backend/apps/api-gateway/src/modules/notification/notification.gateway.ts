import {
  Inject,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { decode as jwtDecode } from 'jsonwebtoken';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@app/shared';
import { GatewayJwtKeyService } from '../auth/gateway-jwt-key.service';
import { TokenRevocationClient } from '../auth/token-revocation.client';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string;
  exp?: number;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: true, credentials: true },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server!: Server;

  private subscriber!: Redis;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly jwtKeyService: GatewayJwtKeyService,
    private readonly revocationClient: TokenRevocationClient,
  ) {}

  async onModuleInit() {
    // Tạo subscriber riêng (ioredis yêu cầu connection riêng cho pub/sub)
    this.subscriber = this.redis.duplicate();

    this.subscriber.on('error', (err) =>
      this.logger.error(`Redis subscriber error: ${err.message}`),
    );

    await this.subscriber.psubscribe('notif:user:*');
    this.logger.log('Subscribed to Redis pattern notif:user:*');

    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      // kênh có dạng notif:user:{userId}
      const userId = channel.split(':')[2];
      if (!userId) return;

      let payload: any;
      try {
        payload = JSON.parse(message);
      } catch {
        this.logger.warn(`Invalid notification payload on ${channel}`);
        return;
      }

      const room = `user:${userId}`;
      this.server.to(room).emit('notification:new', payload);
      this.server.to(room).emit('notification:unread-count-updated');
    });
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      try {
        await this.subscriber.punsubscribe('notif:user:*');
        this.subscriber.disconnect();
      } catch (err) {
        this.logger.warn(`Subscriber cleanup failed: ${(err as Error).message}`);
      }
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        return this.rejectConnection(client, 'Thiếu access token');
      }

      const payload = await this.verifyToken(token);
      const userId = payload.sub;

      if (payload.jti && (await this.revocationClient.isRevoked(payload.jti))) {
        return this.rejectConnection(client, 'Token đã bị thu hồi');
      }

      // Lưu user vào socket data + join room
      (client.data as any).userId = userId;
      (client.data as any).role = payload.role;
      await client.join(`user:${userId}`);

      this.logger.debug(`Client connected: ${client.id} (user ${userId})`);
    } catch (err) {
      this.rejectConnection(client, (err as Error).message || 'Unauthorized');
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as any)?.userId;
    if (userId) {
      this.logger.debug(`Client disconnected: ${client.id} (user ${userId})`);
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake.auth as any)?.token;
    if (typeof authToken === 'string' && authToken) return authToken;

    const headerAuth = client.handshake.headers?.authorization;
    if (typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')) {
      return headerAuth.slice(7);
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken) return queryToken;

    return null;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    const decoded = jwtDecode(token, { complete: true }) as
      | { header?: { kid?: string } }
      | null;
    const kid = decoded?.header?.kid;
    if (!kid) throw new Error('Token thiếu kid header');

    const secret = await this.jwtKeyService.getSecret(kid);
    return this.jwtService.verifyAsync<JwtPayload>(token, { secret });
  }

  private rejectConnection(client: Socket, reason: string) {
    this.logger.warn(`Reject WS connection ${client.id}: ${reason}`);
    client.emit('error', { message: reason });
    client.disconnect(true);
  }
}
