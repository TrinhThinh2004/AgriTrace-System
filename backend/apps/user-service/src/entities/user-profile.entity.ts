import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url!: string;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  farm_name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  farm_location!: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  certifications!: object[];

  @Column({ type: 'text', nullable: true })
  bio!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  // ── Relations ──
  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
