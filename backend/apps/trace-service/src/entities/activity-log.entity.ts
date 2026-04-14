import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ActivityType } from '@app/shared';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // id của batch mà hoạt động này thuộc về
  @Column({ type: 'uuid' })
  batch_id!: string;

  // loại hoạt động: SEEDING, FERTILIZING, SPRAYING, WATERING, PRUNING, HARVESTING, PACKING, OTHER
  @Column({ type: 'enum', enum: ActivityType })
  activity_type!: ActivityType;

  // id của người thực hiện hoạt động này
  @Column({ type: 'uuid' })
  performed_by!: string;
  
  // thời điểm thực hiện hoạt động
  @Column({ type: 'timestamptz' })
  performed_at!: Date;
  // vị trí
  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string;

  // ghi chú
  @Column({ type: 'text', nullable: true })
  notes!: string;

  // các loại công cụ,nguyên liệu sử dụng trong hoạt động
  @Column({ type: 'jsonb', nullable: true, default: [] })
  inputs_used!: object[];

  // chữ ký số của người thực hiện 
  @Column({ type: 'text', nullable: true })
  digital_signature!: string;

  // thời điểm ký
  @Column({ type: 'timestamptz', nullable: true })
  signed_at!: Date;
  
  @CreateDateColumn({ type: 'timestamptz' })
  created_at! : Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;
}
