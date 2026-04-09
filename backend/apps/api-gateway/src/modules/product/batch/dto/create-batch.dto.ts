import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty({ message: 'batch_code không được để trống' })
  batch_code: string;

  @IsUUID('4', { message: 'farm_id phải là UUID hợp lệ' })
  farm_id: string;

  @IsUUID('4', { message: 'crop_category_id phải là UUID hợp lệ' })
  crop_category_id: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên batch không được để trống' })
  name: string;

  @IsOptional()
  @IsDateString({}, { message: 'planting_date phải là ngày hợp lệ (ISO 8601)' })
  planting_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'expected_harvest_date phải là ngày hợp lệ (ISO 8601)' })
  expected_harvest_date?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
