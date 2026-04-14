import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { InspectionType, InspectionResult } from '@app/shared';

@Entity('inspections')
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // id của batch mà hoạt động này thuộc về
  @Column({ type: 'uuid' })
  batch_id!: string;

  // id của inspector (người thực hiện kiểm tra)
  @Column({ type: 'uuid' })
  inspector_id!: string;

  // loại kiểm tra: FIELD_VISIT, LAB_TEST, DOCUMENT_REVIEW, FINAL_CERTIFICATION
  @Column({ type: 'enum', enum: InspectionType })
  inspection_type!: InspectionType;

  // kết quả kiểm tra: PENDING, PASS, FAIL, CONDITIONAL_PASS
  @Column({
    type: 'enum',
    enum: InspectionResult,
    default: InspectionResult.PENDING,
  })
  result!: InspectionResult;
  
  // thời điểm dự kiến thực hiện kiểm tra 
  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at!: Date;
  
  // thời điểm thực tế thực hiện kiểm tra
  @Column({ type: 'timestamptz', nullable: true })
  conducted_at!: Date;

  // ghi chú
  @Column({ type: 'text', nullable: true })
  notes!: string;
  // url của báo cáo kiểm tra (nếu có)
  @Column({ type: 'varchar', length: 500, nullable: true })
  report_url!: string;

  // chữ ký số của inspector sau khi hoàn thành kiểm tra
  @Column({ type: 'text', nullable: true })
  digital_signature!: string;

  // thời điểm ký
  @Column({ type: 'timestamptz', nullable: true })
  signed_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at!: Date | null;
}
