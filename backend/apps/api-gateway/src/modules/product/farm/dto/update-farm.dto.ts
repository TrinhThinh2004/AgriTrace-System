import { IsString, IsOptional, IsIn, IsNumberString } from 'class-validator';

export class UpdateFarmDto {
  @IsOptional()
  @IsString()
  name?: string;

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

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'], { message: 'status phải là ACTIVE hoặc INACTIVE' })
  status?: string;
}
