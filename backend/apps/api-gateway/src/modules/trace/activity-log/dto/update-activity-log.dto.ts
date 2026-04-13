import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputUsedDto } from './create-activity-log.dto';

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

export class UpdateActivityLogDto {
  @IsOptional()
  @IsString()
  @IsIn(ACTIVITY_TYPES, { message: 'activity_type không hợp lệ' })
  activity_type?: string;

  @IsOptional()
  @IsDateString({}, { message: 'performed_at phải là ngày hợp lệ (ISO 8601)' })
  performed_at?: string;

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
