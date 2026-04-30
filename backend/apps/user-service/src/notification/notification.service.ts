import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type Redis from 'ioredis';
import { REDIS_CLIENT, NotificationType } from '@app/shared';
import { Notification } from '../entities/notification.entity';

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string | null;
  data?: Record<string, any> | null;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}
  // Tạo thông báo mới và publish event qua Redis
  async create(input: CreateNotificationInput): Promise<Notification> {
    const entity = this.repo.create({
      user_id: input.user_id,
      type: input.type as NotificationType,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      data: input.data ?? null,
      is_read: false,
    });
    const saved = await this.repo.save(entity);

    // Publish event để api-gateway WS gateway pick up và emit ra client
    try {
      await this.redis.publish(
        `notif:user:${saved.user_id}`,
        JSON.stringify(this.toPlain(saved)),
      );
    } catch (err) {
      this.logger.warn(
        `Redis publish failed for notification ${saved.id}: ${(err as Error).message}`,
      );
    }

    return saved;
  }

  async list(userId: string, page = 1, limit = 20, onlyUnread = false) {
    const where: any = { user_id: userId };
    if (onlyUnread) where.is_read = false;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((n) => this.toPlain(n)),
      pagination: { page, limit, total },
    };
  }
  // Lấy số lượng thông báo chưa đọc của user
  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { user_id: userId, is_read: false } });
  }
  // Đánh dấu một thông báo là đã đọc
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.repo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException('Không tìm thấy thông báo');
    if (notif.user_id !== userId)
      throw new ForbiddenException('Không có quyền trên thông báo này');

    if (!notif.is_read) {
      notif.is_read = true;
      notif.read_at = new Date();
      await this.repo.save(notif);
    }
    return notif;
  }
  // Đánh dấu tất cả thông báo của user là đã đọc
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.repo.update(
      { user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() },
    );
    return result.affected ?? 0;
  }
  // Xóa một thông báo
  async delete(id: string, userId: string): Promise<number> {
    const notif = await this.repo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException('Không tìm thấy thông báo');
    if (notif.user_id !== userId)
      throw new ForbiddenException('Không có quyền trên thông báo này');

    const result = await this.repo.delete({ id });
    return result.affected ?? 0;
  }

  // Map entity → plain object phù hợp với proto NotificationResponse
  toPlain(n: Notification) {
    return {
      id: n.id,
      user_id: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link ?? '',
      data: n.data ? JSON.stringify(n.data) : '',
      is_read: n.is_read,
      read_at: n.read_at ? n.read_at.toISOString() : '',
      created_at: n.created_at.toISOString(),
    };
  }
}
