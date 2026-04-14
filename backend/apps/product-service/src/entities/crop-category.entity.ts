import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { CropCategoryStatus } from '@app/shared';
import { Batch } from './batch.entity';

@Entity('crop_categories')
export class CropCategory {
  // id của crop category
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // tên
  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  // mô tả
  @Column({ type: 'text', nullable: true })
  description!: string;
  // trạng thái: ACTIVE, INACTIVE
  @Column({
    type: 'enum',
    enum: CropCategoryStatus,
    default: CropCategoryStatus.ACTIVE,
  })
  status!: CropCategoryStatus;
  
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;

  // Quan hệ 1-n với Batch
  @OneToMany(() => Batch, (batch) => batch.crop_category)
  batches!: Batch[];
}
