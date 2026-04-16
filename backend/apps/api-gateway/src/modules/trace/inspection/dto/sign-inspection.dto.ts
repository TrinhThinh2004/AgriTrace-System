import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

export class SignInspectionDto {
  @IsString()
  @IsNotEmpty({ message: 'digital_signature không được để trống' })
  digital_signature!: string;

  @IsDateString({}, { message: 'signed_at phải là ngày hợp lệ (ISO 8601)' })
  signed_at!: string;

  @IsUUID('4', { message: 'signer_key_id phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'signer_key_id không được để trống' })
  signer_key_id!: string;
}
