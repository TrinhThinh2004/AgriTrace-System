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
  CROP_PHOTO = 'CROP_PHOTO',
}

@Entity('assets')
@Index(['ref_type', 'ref_id'])
export class Asset {
  // 
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  // id của người sở hữu tài nguyên, có thể là user_id hoặc farm_id tùy loại tài nguyên
  @Column({ type: 'uuid' })
  owner_id!: string;

  // loại tài nguyên, dùng để phân biệt ảnh đại diện người dùng, ảnh nông trại, ảnh lô,... giúp dễ dàng quản lý và truy vấn
  @Column({ type: 'enum', enum: AssetRefType })
  ref_type!: AssetRefType;

  // id tham chiếu, dùng để liên kết với thực thể cụ thể như user_id, farm_id,... tùy loại tài nguyên
  @Column({ type: 'uuid', nullable: true })
  ref_id!: string | null;

  // thông tin về ảnh được lưu trữ trên Cloudinary
  @Column({ type: 'varchar', length: 255 })
  cloudinary_public_id!: string;

  // URL truy cập ảnh
  @Column({ type: 'varchar', length: 1000 })
  url!: string;

  // URL truy cập ảnh qua kết nối bảo mật
  @Column({ type: 'varchar', length: 1000 })
  secure_url!: string;

  // định dạng MIME của ảnh, ví dụ: image/jpeg, image/png,...
  @Column({ type: 'varchar', length: 100 })
  mime!: string;

  // kích thước ảnh tính bằng byte
  @Column({ type: 'bigint', default: 0 })
  bytes!: number;

  // chiều rộng ảnh tính bằng pixel
  @Column({ type: 'int', default: 0 })
  width!: number;

  // chiều cao ảnh tính bằng pixel
  @Column({ type: 'int', default: 0 })
  height!: number;

  // tên file gốc của ảnh, có thể null nếu không có thông tin này
  @Column({ type: 'varchar', length: 255, nullable: true })
  original_filename!: string | null;

  // đánh dấu row được tạo bởi seed script — dùng để --fresh chỉ xóa seed, không đụng ảnh người dùng upload
  @Column({ type: 'boolean', default: false })
  is_seed!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;
}
