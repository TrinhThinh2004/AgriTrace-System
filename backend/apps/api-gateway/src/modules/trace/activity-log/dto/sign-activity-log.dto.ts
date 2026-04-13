import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class SignActivityLogDto {
  @IsString()
  @IsNotEmpty({ message: 'digital_signature không được để trống' })
  digital_signature: string;

  @IsDateString({}, { message: 'signed_at phải là ngày hợp lệ (ISO 8601)' })
  signed_at: string;
}
