import { Module } from '@nestjs/common';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';
import { BatchService } from '../../product/batch/batch.service';
import { SignatureVerifyService } from '../../../common/services/signature-verify.service';

@Module({
  controllers: [InspectionController],
  providers: [InspectionService, BatchService, SignatureVerifyService],
})
export class InspectionModule {}
