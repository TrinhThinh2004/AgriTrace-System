import { Module } from '@nestjs/common';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';
import { BatchService } from '../../product/batch/batch.service';

@Module({
  controllers: [InspectionController],
  providers: [InspectionService, BatchService],
})
export class InspectionModule {}
