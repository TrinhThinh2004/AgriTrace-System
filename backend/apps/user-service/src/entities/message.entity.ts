import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('messages')
@Index('idx_messages_conv_created', ['conversation_id', 'created_at'])
@Index('idx_messages_conv_sender_unread', ['conversation_id', 'sender_id', 'read_at'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  conversation_id!: string;

  @Column({ type: 'uuid' })
  sender_id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'timestamptz', nullable: true })
  read_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
