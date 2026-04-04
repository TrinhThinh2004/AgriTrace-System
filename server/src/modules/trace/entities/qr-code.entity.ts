import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../modules/user/entities/user.entity';
import { Batch } from '../../../modules/product/entities/batch.entity';

@Entity('qr_codes')
export class QRCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batch_id: string;

  /** URL / data encode vào QR: https://domain/trace/{batch_code} */
  @Column({ type: 'text' })
  qr_data: string;

  /** URL tới ảnh QR đã sinh */
  @Column({ type: 'varchar', length: 500, nullable: true })
  qr_image_url: string;

  /** Nhãn kiện hàng */
  @Column({ type: 'varchar', length: 255, nullable: true })
  package_label: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  package_weight: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  package_unit: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  /** Số lần QR được quét */
  @Column({ type: 'int', default: 0 })
  scanned_count: number;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // ── Relations ──
  @ManyToOne(() => Batch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
