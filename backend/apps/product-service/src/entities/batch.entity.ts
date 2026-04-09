import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BatchStatus } from '@app/shared';
import { Farm } from './farm.entity';
import { CropCategory } from './crop-category.entity';

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  batch_code: string;

  @Column({ type: 'uuid' })
  farm_id: string;

  @Column({ type: 'uuid' })
  crop_category_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: BatchStatus, default: BatchStatus.SEEDING })
  status: BatchStatus;

  @Column({ type: 'date', nullable: true })
  planting_date: Date;

  @Column({ type: 'date', nullable: true })
  expected_harvest_date: Date;

  @Column({ type: 'date', nullable: true })
  actual_harvest_date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  harvested_quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  shipped_quantity: number;

  @Column({ type: 'varchar', length: 20, default: 'kg' })
  unit: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Realations
  @ManyToOne(() => Farm, (farm) => farm.batches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @ManyToOne(() => CropCategory, (cc) => cc.batches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'crop_category_id' })
  crop_category: CropCategory;
}
