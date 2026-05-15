import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { CertificationTemplate } from './certification-template.entity';

// Từng tiêu chí trong template. Farmer phải trả lời từng item khi xin chứng nhận.
@Entity('checklist_items')
@Unique('uq_checklist_item_code', ['template_id', 'code'])
export class ChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  template_id!: string;

  // Thứ tự hiển thị trong UI
  @Column({ type: 'int', default: 0 })
  order!: number;

  // Nhóm tiêu chí: "Đất trồng", "Nước tưới", "Phân bón & BVTV", "Thu hoạch", "Ghi chép"
  @Column({ type: 'varchar', length: 100 })
  category!: string;

  // Mã định danh duy nhất trong 1 template (vd SOIL_001)
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // Bắt buộc trả lời mới được submit
  @Column({ type: 'boolean', default: true })
  required!: boolean;

  // Bắt buộc upload ảnh evidence
  @Column({ type: 'boolean', default: false })
  evidence_required!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => CertificationTemplate, (t) => t.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template!: CertificationTemplate;
}
