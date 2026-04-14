import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { FarmStatus, CertificationStatus } from '@app/shared';
import { Batch } from './batch.entity';

@Entity('farms')
export class Farm {
  // id của farm
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // id của owner (người sở hữu farm)
  @Column({ type: 'uuid' })
  owner_id!: string;

  // tên của farm
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  // địa chỉ
  @Column({ type: 'text', nullable: true })
  address!: string;

  // tọa độ vị trí farm (latitude, longitude)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  location_lat!: number;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  location_long!: number;

  // diện tích (hectares)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_hectares!: number;

  // trạng thái chứng nhận: NONE, PENDING, VIETGAP, GLOBALGAP, ORGANIC
  @Column({
    type: 'enum',
    enum: CertificationStatus,
    default: CertificationStatus.NONE,
  })
  certification_status!: CertificationStatus;

  // trạng thái farm: ACTIVE, INACTIVE
  @Column({ type: 'enum', enum: FarmStatus, default: FarmStatus.ACTIVE })
  status!: FarmStatus;
  
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;

  // ── Relations ──
  @OneToMany(() => Batch, (batch) => batch.farm)
  batches!: Batch[];
}
