import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { AuditAction } from '../../../common/enums';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tên bảng / entity bị thay đổi */
  @Column({ type: 'varchar', length: 100 })
  entity_type: string;

  /** ID của record bị thay đổi */
  @Column({ type: 'uuid' })
  entity_id: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  /** UUID user thực hiện */
  @Column({ type: 'uuid' })
  actor_id: string;

  /** Role tại thời điểm thao tác */
  @Column({ type: 'varchar', length: 50, nullable: true })
  actor_role: string;

  /** Snapshot dữ liệu TRƯỚC khi thay đổi */
  @Column({ type: 'jsonb', nullable: true })
  before_data: object;

  /** Snapshot dữ liệu SAU khi thay đổi */
  @Column({ type: 'jsonb', nullable: true })
  after_data: object;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string;

  /** WORM: chỉ INSERT, không cho UPDATE / DELETE */
  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}
