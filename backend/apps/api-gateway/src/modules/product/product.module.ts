import { Module } from '@nestjs/common';

/**
 * ProductModule trong API Gateway chỉ là placeholder.
 * Entities và business logic nằm trong product-service.
 * Mở rộng sau khi product-service được implement gRPC.
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class ProductModule {}
