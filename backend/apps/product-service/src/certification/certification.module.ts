import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationTemplate } from '../entities/certification-template.entity';
import { ChecklistItem } from '../entities/checklist-item.entity';
import { ChecklistResponse } from '../entities/checklist-response.entity';
import { ChecklistResponseItem } from '../entities/checklist-response-item.entity';
import { Farm } from '../entities/farm.entity';
import { CertificationService } from './certification.service';
import { CertTemplateController } from './template.controller';
import { ChecklistController } from './checklist.controller';
import { FarmModule } from '../farm/farm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CertificationTemplate,
      ChecklistItem,
      ChecklistResponse,
      ChecklistResponseItem,
      Farm,
    ]),
    FarmModule,
  ],
  controllers: [CertTemplateController, ChecklistController],
  providers: [CertificationService],
})
export class CertificationModule {}
