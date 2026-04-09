import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CropCategoryService } from './crop-category.service';
import { CropCategory } from '../entities/crop-category.entity';

function toResponse(cc: CropCategory) {
  return {
    id: cc.id,
    name: cc.name,
    description: cc.description ?? '',
    status: cc.status,
    created_at: cc.created_at?.toISOString() ?? '',
    updated_at: cc.updated_at?.toISOString() ?? '',
  };
}
// Controller chỉ nhận gRPC request, không có HTTP endpoint
@Controller()
export class CropCategoryController {
  constructor(private readonly service: CropCategoryService) {}

  @GrpcMethod('ProductService', 'CreateCropCategory')
  async create(data: { name: string; description?: string }) {
    const cc = await this.service.create(data);
    return toResponse(cc);
  }

  @GrpcMethod('ProductService', 'UpdateCropCategory')
  async update(data: {
    id: string;
    name?: string;
    description?: string;
    status?: string;
  }) {
    const cc = await this.service.update(data.id, data);
    return toResponse(cc);
  }

  @GrpcMethod('ProductService', 'DeleteCropCategory')
  async delete(data: { id: string }) {
    await this.service.delete(data.id);
    return {};
  }

  @GrpcMethod('ProductService', 'GetCropCategoryById')
  async getById(data: { id: string }) {
    const cc = await this.service.findById(data.id);
    return toResponse(cc);
  }

  @GrpcMethod('ProductService', 'ListCropCategories')
  async list(data: { status?: string; page?: number; limit?: number }) {
    const result = await this.service.list(data);
    return {
      items: result.items.map(toResponse),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  }
}
