import { Module } from '@nestjs/common';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { SignatureVerifyService } from '../../../common/services/signature-verify.service';

@Module({
  controllers: [ActivityLogController],
  providers: [ActivityLogService, SignatureVerifyService],
})
export class ActivityLogModule {}
