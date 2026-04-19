import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum AssetRefType {
  USER_AVATAR = 'USER_AVATAR',
  FARM_PHOTO = 'FARM_PHOTO',
  BATCH_PHOTO = 'BATCH_PHOTO',
}

@Entity('assets')
@Index(['ref_type', 'ref_id'])
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  owner_id!: string;

  @Column({ type: 'enum', enum: AssetRefType })
  ref_type!: AssetRefType;

  @Column({ type: 'uuid', nullable: true })
  ref_id!: string | null;

  @Column({ type: 'varchar', length: 255 })
  cloudinary_public_id!: string;

  @Column({ type: 'varchar', length: 1000 })
  url!: string;

  @Column({ type: 'varchar', length: 1000 })
  secure_url!: string;

  @Column({ type: 'varchar', length: 100 })
  mime!: string;

  @Column({ type: 'bigint', default: 0 })
  bytes!: number;

  @Column({ type: 'int', default: 0 })
  width!: number;

  @Column({ type: 'int', default: 0 })
  height!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  original_filename!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;
}
