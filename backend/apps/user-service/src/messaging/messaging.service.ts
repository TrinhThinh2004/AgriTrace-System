import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '@app/shared';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';

const MAX_CONTENT_LENGTH = 5000;
const PREVIEW_LENGTH = 200;

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly dataSource: DataSource,
  ) {}

  /** Đảm bảo (a,b) luôn có a < b để unique constraint hoạt động */
  private orderPair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  async getOrCreateConversation(userId: string, otherUserId: string): Promise<Conversation> {
    if (!otherUserId) throw new BadRequestException('Thiếu other_user_id');
    if (userId === otherUserId)
      throw new BadRequestException('Không thể tạo hội thoại với chính mình');

    const other = await this.userRepo.findOne({ where: { id: otherUserId } });
    if (!other) throw new NotFoundException('Không tìm thấy người dùng');

    const [a, b] = this.orderPair(userId, otherUserId);
    let conv = await this.convRepo.findOne({
      where: { participant_a_id: a, participant_b_id: b },
    });
    if (conv) return conv;

    conv = this.convRepo.create({
      participant_a_id: a,
      participant_b_id: b,
      last_message_at: null,
      last_message_preview: null,
    });
    return this.convRepo.save(conv);
  }

  /** Liệt kê hội thoại của user — kèm other_user (joined) và unread_count */
  async listConversations(userId: string) {
    const convs = await this.convRepo
      .createQueryBuilder('c')
      .where('c.participant_a_id = :uid OR c.participant_b_id = :uid', { uid: userId })
      .orderBy('COALESCE(c.last_message_at, c.created_at)', 'DESC')
      .getMany();

    if (convs.length === 0) return { items: [] };

    const otherIds = convs.map((c) =>
      c.participant_a_id === userId ? c.participant_b_id : c.participant_a_id,
    );
    const users = await this.userRepo.find({
      where: { id: In(otherIds) },
      relations: ['profile'],
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // count unread per conversation cho userId
    const unreadRows = await this.msgRepo
      .createQueryBuilder('m')
      .select('m.conversation_id', 'conversation_id')
      .addSelect('COUNT(*)', 'cnt')
      .where('m.conversation_id IN (:...ids)', { ids: convs.map((c) => c.id) })
      .andWhere('m.sender_id != :uid', { uid: userId })
      .andWhere('m.read_at IS NULL')
      .groupBy('m.conversation_id')
      .getRawMany<{ conversation_id: string; cnt: string }>();
    const unreadMap = new Map(unreadRows.map((r) => [r.conversation_id, Number(r.cnt)]));

    const items = convs.map((c) => {
      const otherId = c.participant_a_id === userId ? c.participant_b_id : c.participant_a_id;
      const other = userMap.get(otherId);
      return {
        id: c.id,
        other_user: other ? this.toUserPlain(other) : this.toUserPlain(null, otherId),
        last_message_at: c.last_message_at ? c.last_message_at.toISOString() : '',
        last_message_preview: c.last_message_preview ?? '',
        unread_count: unreadMap.get(c.id) ?? 0,
      };
    });
    return { items };
  }

  async listMessages(conversationId: string, userId: string, page = 1, limit = 30) {
    const conv = await this.assertParticipant(conversationId, userId);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));

    const [rows, total] = await this.msgRepo.findAndCount({
      where: { conversation_id: conv.id },
      order: { created_at: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      items: rows.map((m) => this.toMessagePlain(m)),
      pagination: { page: safePage, limit: safeLimit, total },
    };
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const trimmed = (content ?? '').trim();
    if (!trimmed) throw new BadRequestException('Nội dung tin nhắn không được trống');
    if (trimmed.length > MAX_CONTENT_LENGTH)
      throw new BadRequestException(`Tin nhắn tối đa ${MAX_CONTENT_LENGTH} ký tự`);

    const conv = await this.assertParticipant(conversationId, senderId);
    const recipientId =
      conv.participant_a_id === senderId ? conv.participant_b_id : conv.participant_a_id;

    const preview = trimmed.slice(0, PREVIEW_LENGTH);
    const now = new Date();

    const saved = await this.dataSource.transaction(async (manager) => {
      const msg = manager.create(Message, {
        conversation_id: conv.id,
        sender_id: senderId,
        content: trimmed,
        read_at: null,
      });
      const persisted = await manager.save(msg);
      await manager.update(Conversation, conv.id, {
        last_message_at: now,
        last_message_preview: preview,
      });
      return persisted;
    });

    const plain = this.toMessagePlain(saved);
    // Publish cho cả recipient và sender (multi-tab sync)
    await this.publishMessage(recipientId, plain);
    await this.publishMessage(senderId, plain);

    return plain;
  }

  async markConversationRead(conversationId: string, userId: string): Promise<number> {
    const conv = await this.assertParticipant(conversationId, userId);
    const result = await this.msgRepo.update(
      {
        conversation_id: conv.id,
        sender_id: Not(userId),
        read_at: IsNull(),
      },
      { read_at: new Date() },
    );
    return result.affected ?? 0;
  }

  async getTotalUnreadMessages(userId: string): Promise<number> {
    const count = await this.msgRepo
      .createQueryBuilder('m')
      .innerJoin(Conversation, 'c', 'c.id = m.conversation_id')
      .where('(c.participant_a_id = :uid OR c.participant_b_id = :uid)', { uid: userId })
      .andWhere('m.sender_id != :uid', { uid: userId })
      .andWhere('m.read_at IS NULL')
      .getCount();
    return count;
  }

  private async assertParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Không tìm thấy hội thoại');
    if (conv.participant_a_id !== userId && conv.participant_b_id !== userId)
      throw new ForbiddenException('Bạn không thuộc hội thoại này');
    return conv;
  }

  private async publishMessage(userId: string, message: ReturnType<MessagingService['toMessagePlain']>) {
    try {
      await this.redis.publish(
        `msg:user:${userId}`,
        JSON.stringify({ type: 'message:new', message }),
      );
    } catch (err) {
      this.logger.warn(`Redis publish failed for user ${userId}: ${(err as Error).message}`);
    }
  }

  toMessagePlain(m: Message) {
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      read_at: m.read_at ? m.read_at.toISOString() : '',
      created_at: m.created_at.toISOString(),
    };
  }

  toUserPlain(u: User | null, fallbackId?: string) {
    if (!u) {
      return {
        id: fallbackId ?? '',
        email: '',
        full_name: '',
        role: '',
        status: '',
        phone: '',
        created_at: '',
        avatar_url: '',
        address: '',
        bio: '',
      };
    }
    const profile = (u as any).profile;
    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name ?? '',
      role: u.role ?? '',
      status: u.status ?? '',
      phone: u.phone ?? '',
      created_at: u.created_at ? u.created_at.toISOString() : '',
      avatar_url: profile?.avatar_url ?? '',
      address: profile?.address ?? '',
      bio: profile?.bio ?? '',
    };
  }
}
