import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ActivityLog } from './activity-log.entity';

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  activity_log_id: string;

  /** Tên mục kiểm tra theo tiêu chuẩn VietGAP */
  @Column({ type: 'varchar', length: 255 })
  item_name: string;

  @Column({ type: 'boolean', default: false })
  is_compliant: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ── Relations ──
  @ManyToOne(() => ActivityLog, (log) => log.checklist_items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activity_log_id' })
  activity_log: ActivityLog;
}
