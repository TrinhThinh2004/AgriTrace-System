import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ActivityType } from '../../../common/enums';
import { User } from '../../../modules/user/entities/user.entity';
import { Batch } from '../../../modules/product/entities/batch.entity';
import { ChecklistItem } from './checklist-item.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batch_id: string;

  @Column({ type: 'enum', enum: ActivityType })
  activity_type: ActivityType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** Thời điểm thực hiện hoạt động */
  @Column({ type: 'timestamptz' })
  performed_at: Date;

  @Column({ type: 'uuid' })
  performed_by: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  weather_conditions: string;

  /** Vật tư sử dụng: [{ name, dosage, unit, supplier }] */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  materials_used: object[];

  /** Ảnh minh chứng: ["url1", "url2"] */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  evidence_images: string[];

  /** Chữ ký số của farmer — hash nội dung + private key */
  @Column({ type: 'text', nullable: true })
  digital_signature: string;

  @Column({ type: 'boolean', default: false })
  signature_verified: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // ── Relations ──
  @ManyToOne(() => Batch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'performed_by' })
  performer: User;

  @OneToMany(() => ChecklistItem, (item) => item.activity_log, {
    cascade: true,
  })
  checklist_items: ChecklistItem[];
}
