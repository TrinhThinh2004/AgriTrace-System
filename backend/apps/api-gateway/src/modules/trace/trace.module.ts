import { Module } from '@nestjs/common';

/**
 * TraceModule trong API Gateway chỉ là placeholder.
 * Entities và business logic nằm trong trace-service.
 * Mở rộng sau khi trace-service được implement gRPC.
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class TraceModule {}
