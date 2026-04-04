import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BatchStatus } from '../../../common/enums';
import { User } from '../../../modules/user/entities/user.entity';
import { Farm } from './farm.entity';
import { CropCategory } from './crop-category.entity';

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Mã lô hàng duy nhất — auto-generated: AGR-20260404-XXXX */
  @Column({ type: 'varchar', length: 50, unique: true })
  batch_code: string;

  @Column({ type: 'uuid' })
  farm_id: string;

  @Column({ type: 'uuid' })
  crop_category_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  /** Sản lượng dự kiến */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  /** Đơn vị: kg, tấn, thùng... */
  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'date' })
  planting_date: Date;

  @Column({ type: 'date', nullable: true })
  expected_harvest_date: Date;

  @Column({ type: 'date', nullable: true })
  actual_harvest_date: Date;

  /** Sản lượng thu hoạch thực tế */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  harvested_quantity: number;

  /** Sản lượng đã xuất kho */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipped_quantity: number;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.SEEDING,
  })
  status: BatchStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // ── Relations ──
  @ManyToOne(() => Farm, (farm) => farm.batches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @ManyToOne(() => CropCategory, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'crop_category_id' })
  crop_category: CropCategory;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
