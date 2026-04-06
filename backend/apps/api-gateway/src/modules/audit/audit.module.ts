import { Module } from '@nestjs/common';

/**
 * AuditModule trong API Gateway chỉ là placeholder.
 * Entities và business logic nằm trong audit-service.
 * Mở rộng sau khi audit-service được implement gRPC.
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class AuditModule {}
