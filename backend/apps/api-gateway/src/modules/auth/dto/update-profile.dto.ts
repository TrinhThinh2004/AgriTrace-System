import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[3-9]\d{8}$/, {
    message: 'Số điện thoại không hợp lệ (VD: 0901234567)',
  })
  phone?: string;

  @IsOptional()
  @IsUrl({}, { message: 'avatar_url phải là URL hợp lệ' })
  @MaxLength(500)
  avatar_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;
}
