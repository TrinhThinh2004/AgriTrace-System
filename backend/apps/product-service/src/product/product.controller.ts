import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';

/**
 * gRPC Controller cho ProductService (product.proto).
 * Mỗi @GrpcMethod map với 1 rpc trong proto.
 */
@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ─── rpc GetBatchById ───
  @GrpcMethod('ProductService', 'GetBatchById')
  async getBatchById(data: { batch_id: string }) {
    const batch = await this.productService.getBatchById(data.batch_id);
    return {
      id:               batch.id,
      batch_code:       batch.batch_code,
      farm_id:          batch.farm_id,
      crop_category_id: batch.crop_category_id,
      status:           batch.status,
      created_by:       batch.created_by,
      name:             batch.name,
      planting_date:    batch.planting_date?.toISOString() ?? '',
    };
  }

  // ─── rpc GetFarmById ───
  @GrpcMethod('ProductService', 'GetFarmById')
  async getFarmById(data: { farm_id: string }) {
    const farm = await this.productService.getFarmById(data.farm_id);
    return {
      id:                   farm.id,
      name:                 farm.name,
      address:              farm.address ?? '',
      owner_id:             farm.owner_id,
      certification_status: farm.certification_status,
    };
  }
}
