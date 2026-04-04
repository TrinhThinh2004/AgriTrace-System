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
import { CertificationStatus, FarmStatus } from '../../../common/enums';
import { User } from '../../../modules/user/entities/user.entity';
import { Batch } from './batch.entity';

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  /** Diện tích (hecta) */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_size: number;

  @Column({ type: 'uuid' })
  owner_id: string;

  /** Chi tiết chứng nhận: [{ name: "VietGAP", issued_date, expiry_date, certificate_no }] */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  certifications: object[];

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
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => Batch, (batch) => batch.farm)
  batches: Batch[];
}
