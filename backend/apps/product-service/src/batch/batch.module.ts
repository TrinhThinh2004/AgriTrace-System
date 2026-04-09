import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from '../entities/batch.entity';
import { Farm } from '../entities/farm.entity';
import { CropCategory } from '../entities/crop-category.entity';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';


@Module({
  imports: [TypeOrmModule.forFeature([Batch, Farm, CropCategory])],
  controllers: [BatchController],
  providers: [BatchService],
})
export class BatchModule {}
