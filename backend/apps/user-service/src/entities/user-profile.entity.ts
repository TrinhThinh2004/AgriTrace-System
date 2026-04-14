import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  // id của user profile
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // id của user mà profile này thuộc về
  @Column({ type: 'uuid' })
  user_id!: string;
  // url của ảnh đại diện
  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url!: string;

  // địa chỉ
  @Column({ type: 'text', nullable: true })
  address!: string;

  // tên farm (nếu user là farmer)
  @Column({ type: 'varchar', length: 255, nullable: true })
  farm_name!: string;
  // địa chỉ farm
  @Column({ type: 'varchar', length: 255, nullable: true })
  farm_location!: string;

  // các chứng nhận mà user có (nếu có)
  @Column({ type: 'jsonb', nullable: true, default: [] })
  certifications!: object[];

  // tiểu sử
  @Column({ type: 'text', nullable: true })
  bio!: string;
  
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;

  // ── Relations ──
  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
