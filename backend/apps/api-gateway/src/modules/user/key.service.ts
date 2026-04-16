import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

interface UserServiceGrpc {
  generateKeyPair(data: {
    user_id: string;
    algorithm?: string;
  }): Observable<any>;
  listUserKeys(data: { user_id: string }): Observable<any>;
  revokeKey(data: { key_id: string; user_id: string }): Observable<any>;
  listAllKeys(data: {
    page?: number;
    limit?: number;
    status?: string;
    user_id?: string;
  }): Observable<any>;
  adminRevokeKey(data: { key_id: string }): Observable<any>;
}

@Injectable()
export class KeyService implements OnModuleInit {
  private userService!: UserServiceGrpc;

  constructor(
    @Inject('USER_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserServiceGrpc>('UserService');
  }

  generate(userId: string) {
    return firstValueFrom(
      this.userService.generateKeyPair({ user_id: userId }),
    );
  }

  list(userId: string) {
    return firstValueFrom(
      this.userService.listUserKeys({ user_id: userId }),
    );
  }

  revoke(keyId: string, userId: string) {
    return firstValueFrom(
      this.userService.revokeKey({ key_id: keyId, user_id: userId }),
    );
  }

  listAll(page?: number, limit?: number, status?: string, userId?: string) {
    return firstValueFrom(
      this.userService.listAllKeys({
        page: page || 1,
        limit: limit || 50,
        status,
        user_id: userId,
      }),
    );
  }

  adminRevoke(keyId: string) {
    return firstValueFrom(
      this.userService.adminRevokeKey({ key_id: keyId }),
    );
  }
}
