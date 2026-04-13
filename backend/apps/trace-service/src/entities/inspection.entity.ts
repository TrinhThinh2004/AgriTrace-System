import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InspectionType, InspectionResult } from '@app/shared';

@Entity('inspections')
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** batch_id từ product-service — cross-service reference */
  @Column({ type: 'uuid' })
  batch_id!: string;

  /** user_id của inspector (role: INSPECTOR) — cross-service reference */
  @Column({ type: 'uuid' })
  inspector_id!: string;

  @Column({ type: 'enum', enum: InspectionType })
  inspection_type!: InspectionType;

  @Column({
    type: 'enum',
    enum: InspectionResult,
    default: InspectionResult.PENDING,
  })
  result!: InspectionResult;

  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  conducted_at!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  report_url!: string;

  /** Chữ ký số RSA của inspector (base64) */
  @Column({ type: 'text', nullable: true })
  digital_signature!: string;

  @Column({ type: 'timestamptz', nullable: true })
  signed_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
