import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';

const INSPECTION_TYPES = [
  'FIELD_VISIT',
  'LAB_TEST',
  'DOCUMENT_REVIEW',
  'FINAL_CERTIFICATION',
] as const;

const INSPECTION_RESULTS = [
  'PENDING',
  'PASS',
  'FAIL',
  'CONDITIONAL_PASS',
] as const;

export class CreateInspectionDto {
  @IsString()
  @IsIn(INSPECTION_TYPES, { message: 'inspection_type không hợp lệ' })
  inspection_type: string;

  @IsOptional()
  @IsString()
  @IsIn(INSPECTION_RESULTS, { message: 'result không hợp lệ' })
  result?: string;

  @IsOptional()
  @IsDateString({}, { message: 'scheduled_at phải là ngày hợp lệ (ISO 8601)' })
  scheduled_at?: string;

  @IsOptional()
  @IsDateString({}, { message: 'conducted_at phải là ngày hợp lệ (ISO 8601)' })
  conducted_at?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  report_url?: string;
}
