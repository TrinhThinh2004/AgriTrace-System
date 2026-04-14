import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BatchStatus } from '@app/shared';
import { Farm } from './farm.entity';
import { CropCategory } from './crop-category.entity';

@Entity('batches')
export class Batch {
  // id của batch
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // mã qr code
  @Column({ type: 'varchar', length: 100, unique: true })
  batch_code!: string;

  // id của farm mà batch này thuộc về
  @Column({ type: 'uuid' })
  farm_id!: string;
  
  // id của crop category mà batch này thuộc về
  @Column({ type: 'uuid' })
  crop_category_id!: string;

  //tên của batch
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  // trạng thái hiện tại
  @Column({ type: 'enum', enum: BatchStatus, default: BatchStatus.SEEDING })
  status!: BatchStatus;

  // thời điểm bắt đầu gieo hạt
  @Column({ type: 'date', nullable: true })
  planting_date!: Date;

  // thời điểm dự kiến thu hoạch
  @Column({ type: 'date', nullable: true })
  expected_harvest_date!: Date;

  // thời điểm thu hoạch thực tế
  @Column({ type: 'date', nullable: true })
  actual_harvest_date!: Date;

  // số lượng thu hoạch được
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  harvested_quantity!: number;

  // thời điểm đóng gói
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  shipped_quantity!: number;

  // đơn vị tính cho số lượng thu hoạch (mặc định là kg)
  @Column({ type: 'varchar', length: 20, default: 'kg' })
  unit!: string;

  // ghi chú
  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ type: 'uuid' })
  created_by!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at! : Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;

  // Realations
  @ManyToOne(() => Farm, (farm) => farm.batches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'farm_id' })
  farm!: Farm;

  @ManyToOne(() => CropCategory, (cc) => cc.batches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'crop_category_id' })
  crop_category!: CropCategory;
}
