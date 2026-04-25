import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from '../entities/farm.entity';
import { Batch } from '../entities/batch.entity';
import { FarmService } from './farm.service';
import { FarmController } from './farm.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Farm, Batch])],
  controllers: [FarmController],
  providers: [FarmService],
})
export class FarmModule {}
