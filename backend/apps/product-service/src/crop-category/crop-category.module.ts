import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CropCategory } from '../entities/crop-category.entity';
import { CropCategoryService } from './crop-category.service';
import { CropCategoryController } from './crop-category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CropCategory])],
  controllers: [CropCategoryController],
  providers: [CropCategoryService],
})
export class CropCategoryModule {}
