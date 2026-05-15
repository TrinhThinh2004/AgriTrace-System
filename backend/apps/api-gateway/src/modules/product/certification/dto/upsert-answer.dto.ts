import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpsertAnswerDto {
  @IsString()
  @MaxLength(5000)
  answer!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  evidence_asset_ids?: string[];
}
