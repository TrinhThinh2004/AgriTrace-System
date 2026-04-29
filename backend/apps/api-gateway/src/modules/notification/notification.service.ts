import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { withAuthMetadata } from '../../common/grpc/with-auth-metadata';

interface UserServiceGrpc {
  createNotification(data: any, metadata?: any): Observable<any>;
  listNotifications(data: any, metadata?: any): Observable<any>;
  getUnreadCount(data: any, metadata?: any): Observable<any>;
  markAsRead(data: any, metadata?: any): Observable<any>;
  markAllAsRead(data: any, metadata?: any): Observable<any>;
  deleteNotification(data: any, metadata?: any): Observable<any>;
}

type AuthUser = { id: string; role: string };

@Injectable()
export class NotificationService implements OnModuleInit {
  private userService!: UserServiceGrpc;

  constructor(@Inject('USER_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
  }

  list(user: AuthUser, page = 1, limit = 20, onlyUnread = false) {
    return firstValueFrom(
      this.userService.listNotifications(
        {
          user_id: user.id,
          page: Number(page) || 1,
          limit: Number(limit) || 20,
          only_unread: Boolean(onlyUnread),
        },
        withAuthMetadata(user),
      ),
    );
  }

  unreadCount(user: AuthUser) {
    return firstValueFrom(
      this.userService.getUnreadCount({ user_id: user.id }, withAuthMetadata(user)),
    );
  }

  markAsRead(id: string, user: AuthUser) {
    return firstValueFrom(
      this.userService.markAsRead({ id, user_id: user.id }, withAuthMetadata(user)),
    );
  }

  markAllAsRead(user: AuthUser) {
    return firstValueFrom(
      this.userService.markAllAsRead({ user_id: user.id }, withAuthMetadata(user)),
    );
  }

  delete(id: string, user: AuthUser) {
    return firstValueFrom(
      this.userService.deleteNotification(
        { id, user_id: user.id },
        withAuthMetadata(user),
      ),
    );
  }
}
