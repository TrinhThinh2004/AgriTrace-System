import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InspectionType, InspectionResult } from '../../../common/enums';
import { User } from '../../../modules/user/entities/user.entity';
import { Batch } from '../../../modules/product/entities/batch.entity';

@Entity('inspections')
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batch_id: string;

  @Column({ type: 'uuid' })
  inspector_id: string;

  @Column({ type: 'enum', enum: InspectionType })
  inspection_type: InspectionType;

  @Column({
    type: 'enum',
    enum: InspectionResult,
    default: InspectionResult.PENDING,
  })
  result: InspectionResult;

  /** Điểm đánh giá (0-100) */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  /** Phát hiện chi tiết: [{ criteria, status, comment }] */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  findings: object[];

  /** Ảnh minh chứng kiểm định */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  evidence_images: string[];

  /** Chữ ký số của inspector */
  @Column({ type: 'text', nullable: true })
  digital_signature: string;

  @Column({ type: 'timestamptz' })
  inspected_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // ── Relations ──
  @ManyToOne(() => Batch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;
}
