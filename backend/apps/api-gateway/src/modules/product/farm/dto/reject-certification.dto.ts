import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectCertificationDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lý do từ chối' })
  @MaxLength(500, { message: 'Lý do tối đa 500 ký tự' })
  reason!: string;
}
