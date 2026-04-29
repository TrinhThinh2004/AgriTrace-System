import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @GrpcMethod('UserService', 'CreateNotification')
  async createNotification(data: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    data?: string;
  }) {
    try {
      const parsedData = data.data ? this.tryParseJson(data.data) : null;
      const notif = await this.notificationService.create({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
        data: parsedData,
      });
      return this.notificationService.toPlain(notif);
    } catch (error) {
      this.logger.error(`CreateNotification failed: ${(error as Error).message}`);
      throw error;
    }
  }

  @GrpcMethod('UserService', 'ListNotifications')
  async listNotifications(data: {
    user_id: string;
    page?: number;
    limit?: number;
    only_unread?: boolean;
  }) {
    return this.notificationService.list(
      data.user_id,
      Number(data.page) || 1,
      Number(data.limit) || 20,
      Boolean(data.only_unread),
    );
  }

  @GrpcMethod('UserService', 'GetUnreadCount')
  async getUnreadCount(data: { user_id: string }) {
    const count = await this.notificationService.getUnreadCount(data.user_id);
    return { count };
  }

  @GrpcMethod('UserService', 'MarkAsRead')
  async markAsRead(data: { id: string; user_id: string }) {
    const notif = await this.notificationService.markAsRead(data.id, data.user_id);
    return this.notificationService.toPlain(notif);
  }

  @GrpcMethod('UserService', 'MarkAllAsRead')
  async markAllAsRead(data: { user_id: string }) {
    const affected = await this.notificationService.markAllAsRead(data.user_id);
    return { affected };
  }

  @GrpcMethod('UserService', 'DeleteNotification')
  async deleteNotification(data: { id: string; user_id: string }) {
    const affected = await this.notificationService.delete(data.id, data.user_id);
    return { affected };
  }

  private tryParseJson(value: string): Record<string, any> | null {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}
