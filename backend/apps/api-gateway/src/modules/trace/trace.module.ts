import { Module } from '@nestjs/common';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { InspectionModule } from './inspection/inspection.module';
import { PublicTraceController } from './public-trace.controller';

/**
 * TraceModule trong API Gateway — gom 2 submodule proxy REST → gRPC trace-service.
 * gRPC clients (TRACE_SERVICE, PRODUCT_SERVICE) đã được đăng ký Global trong PolicyModule.
 */
@Module({
  imports: [ActivityLogModule, InspectionModule],
  controllers: [PublicTraceController],
})
export class TraceModule {}
