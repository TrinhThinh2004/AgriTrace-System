import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

const ACTIVITY_TYPES = [
  'SEEDING',
  'FERTILIZING',
  'SPRAYING',
  'WATERING',
  'PRUNING',
  'HARVESTING',
  'PACKING',
  'OTHER',
] as const;

export class InputUsedDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  quantity!: string;

  @IsString()
  @IsNotEmpty()
  unit!: string;
}

export class CreateActivityLogDto {
  @IsString()
  @IsIn(ACTIVITY_TYPES, { message: 'activity_type không hợp lệ' })
  activity_type!: string;

  @IsDateString({}, { message: 'performed_at phải là ngày hợp lệ (ISO 8601)' })
  performed_at!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InputUsedDto)
  inputs_used?: InputUsedDto[];
}
