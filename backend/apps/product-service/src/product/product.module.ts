import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from '../entities/batch.entity';
import { Farm } from '../entities/farm.entity';
import { CropCategory } from '../entities/crop-category.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Batch, Farm, CropCategory])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
