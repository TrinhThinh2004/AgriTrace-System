import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_keys')
export class UserKey {
  // id của user key
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  // id của user mà key này thuộc về
  @Column({ type: 'uuid' })
  user_id!: string;
  // tên của key
  @Column({ type: 'text' })
  public_key!: string;

  // thuật toán của key
  @Column({ type: 'varchar', length: 50, default: 'RSA-SHA256' })
  algorithm!: string;

  // trạng thái của key: active, revoked
  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at!: Date;

  // Quan hệ n-1 với User
  @ManyToOne(() => User, (user) => user.keys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
