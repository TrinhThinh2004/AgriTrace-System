import { Module } from '@nestjs/common';

/**
 * MediaModule trong API Gateway chỉ là placeholder.
 * Entities và business logic nằm trong media-service.
 * Mở rộng sau khi media-service được implement gRPC.
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class MediaModule {}
