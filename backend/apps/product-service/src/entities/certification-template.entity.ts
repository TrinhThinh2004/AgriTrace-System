import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CertificationStatus } from '@app/shared';
import { ChecklistItem } from './checklist-item.entity';

// Template chứng nhận: VietGAP / GlobalGAP / Organic. Admin tạo. Farmer chọn khi xin cấp chứng nhận.
@Entity('certification_templates')
export class CertificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  // Loại chứng nhận (VIETGAP / GLOBALGAP / ORGANIC). Dùng lại CertificationStatus.
  @Column({ type: 'enum', enum: CertificationStatus })
  cert_type!: CertificationStatus;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;

  @OneToMany(() => ChecklistItem, (item) => item.template, { cascade: false })
  items!: ChecklistItem[];
}
