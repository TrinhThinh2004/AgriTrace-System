import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ChecklistResponse } from './checklist-response.entity';
import { ChecklistItem } from './checklist-item.entity';

// 1 câu trả lời của farmer cho 1 ChecklistItem trong 1 ChecklistResponse.
@Entity('checklist_response_items')
@Unique('uq_resp_item', ['response_id', 'item_id'])
export class ChecklistResponseItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  response_id!: string;

  @Column({ type: 'uuid' })
  item_id!: string;

  // Trả lời text của farmer cho tiêu chí
  @Column({ type: 'text', default: '' })
  answer!: string;

  // Danh sách asset id (từ media-service) - upload ảnh chứng minh
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  evidence_asset_ids!: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => ChecklistResponse, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response!: ChecklistResponse;

  @ManyToOne(() => ChecklistItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'item_id' })
  item!: ChecklistItem;
}
