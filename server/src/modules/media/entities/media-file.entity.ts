import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MediaEntityType } from '../../../common/enums';
import { User } from '../../../modules/user/entities/user.entity';

@Entity('media_files')
export class MediaFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tên file trên server (UUID-based) */
  @Column({ type: 'varchar', length: 255 })
  filename: string;

  /** Tên file gốc khi upload */
  @Column({ type: 'varchar', length: 255 })
  original_name: string;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'bigint' })
  size_bytes: number;

  /** URL truy cập file */
  @Column({ type: 'varchar', length: 500 })
  url: string;

  /** URL ảnh thumbnail (nếu có) */
  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url: string;

  @Column({ type: 'uuid' })
  uploaded_by: string;

  /** Loại entity mà file này thuộc về */
  @Column({ type: 'enum', enum: MediaEntityType, nullable: true })
  entity_type: MediaEntityType;

  /** ID của entity liên quan */
  @Column({ type: 'uuid', nullable: true })
  entity_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // ── Relations ──
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;
}
