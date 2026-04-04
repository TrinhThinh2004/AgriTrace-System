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
import { CropCategoryStatus } from '../../../common/enums';

@Entity('crop_categories')
export class CropCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string;

  /** Thời gian canh tác dự kiến (ngày) */
  @Column({ type: 'int', nullable: true })
  growing_duration_days: number;

  @Column({
    type: 'enum',
    enum: CropCategoryStatus,
    default: CropCategoryStatus.ACTIVE,
  })
  status: CropCategoryStatus;

  /** UUID của admin tạo danh mục */
  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
