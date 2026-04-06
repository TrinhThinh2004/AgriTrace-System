import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { FarmStatus, CertificationStatus } from '@app/shared';
import { Batch } from './batch.entity';

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** user_id từ user-service — cross-service reference (không có FK constraint) */
  @Column({ type: 'uuid' })
  owner_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  location_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  location_long: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_hectares: number;

  @Column({
    type: 'enum',
    enum: CertificationStatus,
    default: CertificationStatus.NONE,
  })
  certification_status: CertificationStatus;

  @Column({ type: 'enum', enum: FarmStatus, default: FarmStatus.ACTIVE })
  status: FarmStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // ── Relations ──
  @OneToMany(() => Batch, (batch) => batch.farm)
  batches: Batch[];
}
