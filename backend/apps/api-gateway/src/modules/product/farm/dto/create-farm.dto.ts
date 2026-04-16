import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  IsIn,
  IsNumberString,
} from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateFarmDto {
  @IsOptional()
  @Matches(UUID_REGEX, { message: 'owner_id phải là UUID hợp lệ' })
  owner_id?: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên farm không được để trống' })
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'location_lat phải là số' })
  location_lat?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'location_long phải là số' })
  location_long?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'area_hectares phải là số' })
  area_hectares?: string;

  @IsOptional()
  @IsIn(['NONE', 'PENDING', 'VIETGAP', 'GLOBALGAP', 'ORGANIC'], {
    message: 'certification_status phải là: NONE, PENDING, VIETGAP, GLOBALGAP, hoặc ORGANIC',
  })
  certification_status?: string;
}
