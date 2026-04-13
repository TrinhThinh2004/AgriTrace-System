import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface UserServiceGrpc {
  listUsers(data: { role?: string; page?: number; limit?: number }): Observable<any>;
  createUser(data: any): Observable<any>;
  updateUser(data: any): Observable<any>;
  deleteUser(data: { id: string }): Observable<any>;
}

@Injectable()
export class UserService implements OnModuleInit {
  private grpc: UserServiceGrpc;

  constructor(
    @Inject('USER_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.grpc = this.client.getService<UserServiceGrpc>('UserService');
  }

  list(query: { role?: string; page?: number; limit?: number }) {
    return firstValueFrom(
      this.grpc.listUsers(query),
    );
  }

  create(dto: Record<string, any>) {
    return firstValueFrom(
      this.grpc.createUser(dto),
    );
  }

  update(id: string, dto: Record<string, any>) {
    return firstValueFrom(
      this.grpc.updateUser({ ...dto, id }),
    );
  }

  delete(id: string) {
    return firstValueFrom(
      this.grpc.deleteUser({ id }),
    );
  }
}
