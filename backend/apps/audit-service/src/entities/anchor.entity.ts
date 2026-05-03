import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
// bảng anchors lưu trữ thông tin về các batch audit log đã được anchored on-chain, bao gồm merkle root của batch, phạm vi seq_no của batch,
//  tx hash và block number của transaction chứa anchor trên blockchain,
@Entity('anchors')
@Index('idx_anchor_range', ['from_seq', 'to_seq'])
@Index('idx_anchor_tx', ['tx_hash'])
export class Anchor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  //merkle root của batch các audit log đã được anchored on-chain trong khoảng from_seq đến to_seq
  @Column({ type: 'varchar', length: 66 })
  merkle_root!: string;

  // Số thứ tự của audit log đầu tiên trong batch này (tính từ 1)
  @Column({ type: 'bigint' })
  from_seq!: string;

  // Số thứ tự của audit log cuối cùng trong batch này (tính từ 1)
  @Column({ type: 'bigint' })
  to_seq!: string;

  // Hash của transaction chứa anchor này
  @Column({ type: 'varchar', length: 66 })
  tx_hash!: string;

  // Số block mà transaction này được confirm
  @Column({ type: 'bigint' })
  block_number!: string;

  // Chain ID của blockchain mà anchor này được lưu trữ (vd: 80002 = Polygon Amoy)
  @Column({ type: 'integer' })
  chain_id!: number; // 80002 = Polygon Amoy

  // ID của record anchor này trên blockchain
  @Column({ type: 'bigint' })
  onchain_anchor_id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  anchored_at!: Date;
}
