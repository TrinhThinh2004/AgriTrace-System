import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Generated,
  Index,
} from 'typeorm';
import { Role } from '@app/shared';

// bảng audit_logs lưu trữ các audit log của hệ thống,
//  mỗi record đại diện cho một sự kiện cần được audit, bao gồm thông tin về actor, action,
//  entity, dữ liệu trước/sau khi thay đổi, metadata bổ sung, và các trường prev_hash/record_hash để đảm bảo tính toàn vẹn của chuỗi audit log.
@Entity('audit_logs')
@Index('idx_audit_entity', ['entity_type', 'entity_id'])
@Index('idx_audit_actor', ['actor_id'])
@Index('idx_audit_action', ['action'])
@Index('idx_audit_created_at', ['created_at'])
@Index('idx_audit_anchor', ['anchor_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Monotonic sequence number — drives hash chain ordering.
  // bigint serialized as string by typeorm (>2^53 safety).
  @Column({ type: 'bigint', unique: true })
  @Generated('increment')
  seq_no!: string;

  // Actor (null cho system actions hoặc public auth flows)
  @Column({ type: 'uuid', nullable: true })
  actor_id!: string | null;

  @Column({ type: 'enum', enum: Role, nullable: true })
  actor_role!: Role | null;

  // Action code — see AUDIT_ACTIONS in @app/shared
  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 100 })
  entity_type!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  entity_id!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  before_data!: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  after_data!: Record<string, any> | null;

  // { ip, user_agent, request_id, error?, ... }
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  // sha256 hex (64 chars). First record uses 64 zeros.
  @Column({ type: 'char', length: 64 })
  prev_hash!: string;

  @Column({ type: 'char', length: 64 })
  record_hash!: string;

  // FK → anchors.id, set bởi Anchor Worker. Null = chưa anchor.
  @Column({ type: 'uuid', nullable: true })
  anchor_id!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
