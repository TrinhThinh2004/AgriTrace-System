import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 số',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  full_name: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[3-9]\d{8}$/, {
    message: 'Số điện thoại không hợp lệ (VD: 0901234567)',
  })
  phone?: string;
}
