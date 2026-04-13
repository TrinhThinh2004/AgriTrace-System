import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ActivityType } from '@app/shared';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** batch_id từ product-service — cross-service reference (không có FK constraint) */
  @Column({ type: 'uuid' })
  batch_id!: string;

  @Column({ type: 'enum', enum: ActivityType })
  activity_type!: ActivityType;

  /** user_id của người thực hiện — cross-service reference */
  @Column({ type: 'uuid' })
  performed_by!: string;

  @Column({ type: 'timestamptz' })
  performed_at!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  /** Vật tư sử dụng: [{ name, quantity, unit }] */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  inputs_used!: object[];

  /** Chữ ký số RSA của người thực hiện (base64) */
  @Column({ type: 'text', nullable: true })
  digital_signature!: string;

  @Column({ type: 'timestamptz', nullable: true })
  signed_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at! : Date;
}
