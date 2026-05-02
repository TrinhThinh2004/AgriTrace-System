import { IsIn } from 'class-validator';

export class RequestCertificationDto {
  @IsIn(['VIETGAP', 'GLOBALGAP', 'ORGANIC'], {
    message: 'requested_type phải là VIETGAP, GLOBALGAP hoặc ORGANIC',
  })
  requested_type!: string;
}
