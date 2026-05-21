import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MessagingService } from './messaging.service';

@Controller()
export class MessagingController {
  private readonly logger = new Logger(MessagingController.name);

  constructor(private readonly service: MessagingService) {}

  @GrpcMethod('UserService', 'ListConversations')
  async listConversations(data: { user_id: string }) {
    return this.service.listConversations(data.user_id);
  }

  @GrpcMethod('UserService', 'GetOrCreateConversation')
  async getOrCreateConversation(data: { user_id: string; other_user_id: string }) {
    const conv = await this.service.getOrCreateConversation(data.user_id, data.other_user_id);
    // Trả về đầy đủ ConversationResponse (other_user + counters) để FE dùng ngay
    const list = await this.service.listConversations(data.user_id);
    const found = list.items.find((c) => c.id === conv.id);
    if (found) return found;
    // Conversation vừa tạo, chưa có message → unread_count = 0, other_user lookup riêng
    return {
      id: conv.id,
      other_user: this.service.toUserPlain(null, data.other_user_id),
      last_message_at: '',
      last_message_preview: '',
      unread_count: 0,
    };
  }

  @GrpcMethod('UserService', 'ListMessages')
  async listMessages(data: {
    conversation_id: string;
    user_id: string;
    page?: number;
    limit?: number;
  }) {
    return this.service.listMessages(
      data.conversation_id,
      data.user_id,
      Number(data.page) || 1,
      Number(data.limit) || 30,
    );
  }

  @GrpcMethod('UserService', 'SendMessage')
  async sendMessage(data: { conversation_id: string; sender_id: string; content: string }) {
    return this.service.sendMessage(data.conversation_id, data.sender_id, data.content);
  }

  @GrpcMethod('UserService', 'MarkConversationRead')
  async markConversationRead(data: { conversation_id: string; user_id: string }) {
    const affected = await this.service.markConversationRead(data.conversation_id, data.user_id);
    return { affected };
  }

  @GrpcMethod('UserService', 'GetTotalUnreadMessages')
  async getTotalUnreadMessages(data: { user_id: string }) {
    const count = await this.service.getTotalUnreadMessages(data.user_id);
    return { count };
  }
}
