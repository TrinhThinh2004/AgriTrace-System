import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { withAuthMetadata } from '../../common/grpc/with-auth-metadata';

interface UserServiceGrpc {
  listConversations(data: any, metadata?: any): Observable<any>;
  getOrCreateConversation(data: any, metadata?: any): Observable<any>;
  listMessages(data: any, metadata?: any): Observable<any>;
  sendMessage(data: any, metadata?: any): Observable<any>;
  markConversationRead(data: any, metadata?: any): Observable<any>;
  getTotalUnreadMessages(data: any, metadata?: any): Observable<any>;
  listUsers(data: any, metadata?: any): Observable<any>;
}

type AuthUser = { id: string; role: string };

@Injectable()
export class MessagingService implements OnModuleInit {
  private userService!: UserServiceGrpc;

  constructor(@Inject('USER_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>('UserService');
  }

  listConversations(user: AuthUser) {
    return firstValueFrom(
      this.userService.listConversations({ user_id: user.id }, withAuthMetadata(user)),
    );
  }

  getOrCreateConversation(user: AuthUser, otherUserId: string) {
    return firstValueFrom(
      this.userService.getOrCreateConversation(
        { user_id: user.id, other_user_id: otherUserId },
        withAuthMetadata(user),
      ),
    );
  }

  listMessages(user: AuthUser, conversationId: string, page = 1, limit = 30) {
    return firstValueFrom(
      this.userService.listMessages(
        {
          conversation_id: conversationId,
          user_id: user.id,
          page: Number(page) || 1,
          limit: Number(limit) || 30,
        },
        withAuthMetadata(user),
      ),
    );
  }

  sendMessage(user: AuthUser, conversationId: string, content: string) {
    return firstValueFrom(
      this.userService.sendMessage(
        { conversation_id: conversationId, sender_id: user.id, content },
        withAuthMetadata(user),
      ),
    );
  }

  markConversationRead(user: AuthUser, conversationId: string) {
    return firstValueFrom(
      this.userService.markConversationRead(
        { conversation_id: conversationId, user_id: user.id },
        withAuthMetadata(user),
      ),
    );
  }

  totalUnread(user: AuthUser) {
    return firstValueFrom(
      this.userService.getTotalUnreadMessages({ user_id: user.id }, withAuthMetadata(user)),
    );
  }

  /** Danh sách user có thể nhắn tin — strip các field nhạy cảm trước khi trả về client */
  async listContacts(user: AuthUser, search?: string) {
    const res = await firstValueFrom(
      this.userService.listUsers(
        { page: 1, limit: 200, role: '' },
        withAuthMetadata(user),
      ),
    );
    const items = (res?.items ?? [])
      .filter((u: any) => u.id !== user.id && (u.status || 'ACTIVE') === 'ACTIVE')
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        avatar_url: u.avatar_url ?? '',
      }));
    if (!search) return { items };
    const q = search.toLowerCase();
    return {
      items: items.filter(
        (u: any) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      ),
    };
  }
}
