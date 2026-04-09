import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsDateString,
  IsNumberString,
} from 'class-validator';

export class TransitionBatchDto {
  @IsString()
  @IsNotEmpty({ message: 'next_status không được để trống' })
  @IsIn(['SEEDING', 'GROWING', 'HARVESTED', 'INSPECTED', 'PACKED', 'SHIPPED'], {
    message: 'next_status phải là: SEEDING, GROWING, HARVESTED, INSPECTED, PACKED, SHIPPED',
  })
  next_status: string;

  @IsOptional()
  @IsDateString({}, { message: 'actual_harvest_date phải là ngày hợp lệ (ISO 8601)' })
  actual_harvest_date?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'harvested_quantity phải là số' })
  harvested_quantity?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'shipped_quantity phải là số' })
  shipped_quantity?: string;
}
