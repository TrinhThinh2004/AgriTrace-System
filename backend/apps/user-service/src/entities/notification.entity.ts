import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { NotificationType } from '@app/shared';

@Entity('notifications')
@Index('idx_notifications_user_unread_created', ['user_id', 'is_read', 'created_at'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // user nhận thông báo
  @Column({ type: 'uuid' })
  @Index()
  user_id!: string;

  // loại thông báo
  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  // tiêu đề ngắn gọn
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  // nội dung chi tiết
  @Column({ type: 'text' })
  message!: string;

  // optional link khi click vào thông báo sẽ dẫn đến
  @Column({ type: 'varchar', length: 500, nullable: true })
  link!: string | null;

  // metadata phụ (batch_id, inspection_id, ...)
  @Column({ type: 'jsonb', nullable: true })
  data!: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  read_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
