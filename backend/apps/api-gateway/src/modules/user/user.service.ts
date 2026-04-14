import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

interface UserServiceGrpc {
  listUsers(data: { role?: string; page?: number; limit?: number }): Observable<any>;
  createUser(data: any): Observable<any>;
  updateUser(data: any): Observable<any>;
  deleteUser(data: { id: string }): Observable<any>;
}

@Injectable()
export class UserService implements OnModuleInit {
  private userService!: UserServiceGrpc;

  constructor(@Inject('USER_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
  }

  list(role?: string, page = 1, limit = 50) {
    return firstValueFrom(
      this.userService.listUsers({ role, page: Number(page) || 1, limit: Number(limit) || 50 }),
    );
  }

  create(dto: any) {
    return firstValueFrom(this.userService.createUser(dto));
  }

  update(id: string, dto: any) {
    return firstValueFrom(this.userService.updateUser({ ...dto, id }));
  }

  delete(id: string) {
    return firstValueFrom(this.userService.deleteUser({ id }));
  }
}
