import { IsNotEmpty, IsString } from 'class-validator';

export class StartChecklistDto {
  @IsString()
  @IsNotEmpty({ message: 'template_id không được rỗng' })
  template_id!: string;
}
