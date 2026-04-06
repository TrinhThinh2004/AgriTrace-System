import { Module } from '@nestjs/common';

/**
 * UserModule trong API Gateway chỉ còn là placeholder.
 * Entities và business logic đã chuyển sang user-service.
 * Module này có thể mở rộng sau nếu cần thêm user-related
 * endpoints (e.g., admin manage users) thông qua gRPC client.
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class UserModule {}
