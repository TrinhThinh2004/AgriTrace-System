import { IsIn, IsOptional } from 'class-validator';

export class ApproveCertificationDto {
  @IsOptional()
  @IsIn(['VIETGAP', 'GLOBALGAP', 'ORGANIC'], {
    message: 'granted_type phải là VIETGAP, GLOBALGAP hoặc ORGANIC',
  })
  granted_type?: string;
}
