import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';


@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // rpc GetBatchById
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

  // rpc GetFarmById
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

  // rpc CheckFarmOwnership — ABAC
  @GrpcMethod('ProductService', 'CheckFarmOwnership')
  async checkFarmOwnership(data: { user_id: string; farm_id: string }) {
    const allowed = await this.productService.checkFarmOwnership(
      data.user_id,
      data.farm_id,
    );
    return { allowed };
  }

  // rpc CheckBatchOwnership — ABAC
  @GrpcMethod('ProductService', 'CheckBatchOwnership')
  async checkBatchOwnership(data: { user_id: string; batch_id: string }) {
    const allowed = await this.productService.checkBatchOwnership(
      data.user_id,
      data.batch_id,
    );
    return { allowed };
  }
}
