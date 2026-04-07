import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CropCategoryStatus } from '@app/shared';
import { Batch } from './batch.entity';

@Entity('crop_categories')
export class CropCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CropCategoryStatus,
    default: CropCategoryStatus.ACTIVE,
  })
  status: CropCategoryStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => Batch, (batch) => batch.crop_category)
  batches: Batch[];
}
