import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateCropCategoryDto {
  @IsOptional()
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'], { message: 'Status phải là ACTIVE hoặc INACTIVE' })
  status?: string;
}
