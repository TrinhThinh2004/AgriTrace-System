import { Module } from '@nestjs/common';
import { CropCategoryController } from './crop-category/crop-category.controller';
import { CropCategoryService } from './crop-category/crop-category.service';
import { FarmController } from './farm/farm.controller';
import { FarmService } from './farm/farm.service';
import { BatchController } from './batch/batch.controller';
import { BatchService } from './batch/batch.service';
import { CertTemplateController } from './certification/template.controller';
import { ChecklistController } from './certification/checklist.controller';
import { CertificationService } from './certification/certification.service';

/**
 * ProductModule trong API Gateway:
 * - gRPC client PRODUCT_SERVICE đã register global trong PolicyModule
 * - Chỉ cần khai báo controllers và services proxy
 */
@Module({
  controllers: [
    CropCategoryController,
    FarmController,
    BatchController,
    CertTemplateController,
    ChecklistController,
  ],
  providers: [
    CropCategoryService,
    FarmService,
    BatchService,
    CertificationService,
  ],
})
export class ProductModule {}
