import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('conversations')
@Unique('uq_conversations_pair', ['participant_a_id', 'participant_b_id'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Quy ước: participant_a_id < participant_b_id (so sánh chuỗi)
  // → unique (a, b) đảm bảo mỗi cặp user chỉ có đúng 1 conversation
  @Column({ type: 'uuid' })
  @Index()
  participant_a_id!: string;

  @Column({ type: 'uuid' })
  @Index()
  participant_b_id!: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_message_at!: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  last_message_preview!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
