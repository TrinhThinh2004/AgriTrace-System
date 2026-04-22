import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type JwtKeyPurpose = 'access' | 'refresh';
export type JwtKeyStatus = 'active' | 'retiring' | 'retired';

@Entity('jwt_keys')
@Index(['purpose', 'status'])
export class JwtKey {
  // Kid là key ID, một định danh duy nhất cho mỗi khóa JWT
  @PrimaryColumn({ type: 'uuid' })
  kid!: string;

  // Mục đích của khóa JWT, có thể là 'access' hoặc 'refresh'
  @Column({ type: 'varchar', length: 16 })
  purpose!: JwtKeyPurpose;

  // Giá trị bí mật của khóa JWT, được sử dụng để ký và xác minh token
  @Column({ type: 'text' })
  secret!: string;

  // Thuật toán được sử dụng để ký JWT, mặc định là 'HS256'
  @Column({ type: 'varchar', length: 16, default: 'HS256' })
  algorithm!: string;

  // Trạng thái của khóa JWT, có thể là 'active', 'retiring', hoặc 'retired'
  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: JwtKeyStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  retired_at!: Date | null;
}
