import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Role, UserStatus } from '@app/shared';
import { UserProfile } from './user-profile.entity';
import { UserKey } from './user-key.entity';

@Entity('users')
export class User {
  // id của user
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // email của user (bắt buộc, duy nhất)
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  // hash của mật khẩu
  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  // tên đầy đủ của user
  @Column({ type: 'varchar', length: 255 })
  full_name!: string;

  // số điện thoại
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string;

  // vai trò của user: ADMIN, FARMER, INSPECTOR
  @Column({ type: 'enum', enum: Role, default: Role.FARMER })
  role!: Role;
  
  // trạng thái của user: ACTIVE, INACTIVE, SUSPENDED
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;

  /** Hash của refresh token hiện tại — null khi đã logout */
  @Column({ type: 'varchar', length: 255, nullable: true })
  refresh_token_hash!: string;

  // ── Relations ──
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile!: UserProfile;

  @OneToMany(() => UserKey, (key) => key.user, { cascade: true })
  keys!: UserKey[];
}
