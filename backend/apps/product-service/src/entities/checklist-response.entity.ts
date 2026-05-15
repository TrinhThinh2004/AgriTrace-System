import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ChecklistResponseStatus } from '@app/shared';
import { CertificationTemplate } from './certification-template.entity';
import { ChecklistResponseItem } from './checklist-response-item.entity';

// 1 lần farmer điền checklist cho 1 farm theo 1 template.
@Entity('checklist_responses')
@Index('idx_checklist_resp_farm_status', ['farm_id', 'status'])
export class ChecklistResponse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  farm_id!: string;

  @Index()
  @Column({ type: 'uuid' })
  template_id!: string;

  @Column({
    type: 'enum',
    enum: ChecklistResponseStatus,
    default: ChecklistResponseStatus.DRAFT,
  })
  status!: ChecklistResponseStatus;

  @Column({ type: 'timestamptz', nullable: true })
  submitted_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at!: Date | null;

  // Admin nào duyệt / reject
  @Column({ type: 'uuid', nullable: true })
  reviewed_by!: string | null;

  // Ghi chú của admin khi duyệt / lý do reject
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;

  @ManyToOne(() => CertificationTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'template_id' })
  template!: CertificationTemplate;

  @OneToMany(() => ChecklistResponseItem, (item) => item.response, {
    cascade: ['insert', 'update'],
  })
  items!: ChecklistResponseItem[];
}
