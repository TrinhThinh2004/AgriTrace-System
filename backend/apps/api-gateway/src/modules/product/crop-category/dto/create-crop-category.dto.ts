import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCropCategoryDto {
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
