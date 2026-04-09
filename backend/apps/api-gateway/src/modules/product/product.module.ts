import { Module } from '@nestjs/common';
import { CropCategoryController } from './crop-category/crop-category.controller';
import { CropCategoryService } from './crop-category/crop-category.service';
import { FarmController } from './farm/farm.controller';
import { FarmService } from './farm/farm.service';
import { BatchController } from './batch/batch.controller';
import { BatchService } from './batch/batch.service';

/**
 * ProductModule trong API Gateway:
 * - gRPC client PRODUCT_SERVICE đã register global trong PolicyModule
 * - Chỉ cần khai báo controllers và services proxy
 */
@Module({
  controllers: [CropCategoryController, FarmController, BatchController],
  providers: [CropCategoryService, FarmService, BatchService],
})
export class ProductModule {}
