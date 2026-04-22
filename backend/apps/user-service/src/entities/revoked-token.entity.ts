import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('revoked_access_tokens')
@Index(['expires_at'])
export class RevokedAccessToken {
  // JTI là token ID, một định danh duy nhất cho mỗi token đã bị thu hồi
  @PrimaryColumn({ type: 'uuid' })
  jti!: string;

  // ID của người dùng sở hữu token đã bị thu hồi
  @Column({ type: 'uuid' })
  user_id!: string;
  
  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  revoked_at!: Date;
}
