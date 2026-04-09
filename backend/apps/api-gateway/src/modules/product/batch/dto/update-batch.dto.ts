import { IsString, IsOptional, IsDateString, IsNumberString } from 'class-validator';

export class UpdateBatchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString({}, { message: 'planting_date phải là ngày hợp lệ (ISO 8601)' })
  planting_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'expected_harvest_date phải là ngày hợp lệ (ISO 8601)' })
  expected_harvest_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'actual_harvest_date phải là ngày hợp lệ (ISO 8601)' })
  actual_harvest_date?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'harvested_quantity phải là số' })
  harvested_quantity?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'shipped_quantity phải là số' })
  shipped_quantity?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
