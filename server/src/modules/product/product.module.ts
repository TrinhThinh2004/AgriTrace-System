import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CropCategory } from './entities/crop-category.entity';
import { Farm } from './entities/farm.entity';
import { Batch } from './entities/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CropCategory, Farm, Batch])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class ProductModule {}
