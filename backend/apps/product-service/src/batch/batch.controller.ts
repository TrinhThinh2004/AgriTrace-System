import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BatchService } from './batch.service';
import { Batch } from '../entities/batch.entity';
import { GrpcAuthContext, GrpcAuthInterceptor } from '../common/grpc-auth.interceptor';
import { GrpcExceptionFilter } from '../common/grpc-exception.filter';

function toResponse(b: Batch) {
  return {
    id: b.id,
    batch_code: b.batch_code,
    farm_id: b.farm_id,
    crop_category_id: b.crop_category_id,
    name: b.name,
    status: b.status,
    planting_date: b.planting_date?.toString() ?? '',
    expected_harvest_date: b.expected_harvest_date?.toString() ?? '',
    actual_harvest_date: b.actual_harvest_date?.toString() ?? '',
    harvested_quantity:
      b.harvested_quantity != null ? String(b.harvested_quantity) : '',
    shipped_quantity:
      b.shipped_quantity != null ? String(b.shipped_quantity) : '',
    unit: b.unit ?? 'kg',
    notes: b.notes ?? '',
    created_by: b.created_by,
    created_at: b.created_at?.toISOString() ?? '',
    updated_at: b.updated_at?.toISOString() ?? '',
  };
}

interface AuthData {
  __auth?: GrpcAuthContext;
}

// Controller chỉ nhận gRPC request, không có HTTP endpoint
@Controller()
@UseInterceptors(GrpcAuthInterceptor)
@UseFilters(new GrpcExceptionFilter())
export class BatchController {
  constructor(private readonly service: BatchService) { }

  @GrpcMethod('ProductService', 'CreateBatch')
  async create(data: AuthData & Record<string, any>) {
    const caller = data.__auth ?? { userId: null, role: null };
    const batch = await this.service.create(data as any, caller);
    return toResponse(batch);
  }

  @GrpcMethod('ProductService', 'UpdateBatch')
  async update(data: { id: string } & Record<string, any>) {
    const batch = await this.service.update(data.id, data as any);
    return toResponse(batch);
  }

  @GrpcMethod('ProductService', 'DeleteBatch')
  async delete(data: { id: string }) {
    await this.service.delete(data.id);
    return {};
  }

  @GrpcMethod('ProductService', 'ListBatches')
  async list(data: AuthData & {
    farm_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const caller = data.__auth ?? { userId: null, role: null };
    // Farmer chỉ thấy batches thuộc farm của mình, Admin/Inspector thấy tất cả
    const owner_id = caller.role === 'FARMER' ? caller.userId ?? undefined : undefined;
    const result = await this.service.list({ ...data, owner_id });
    return {
      items: result.items.map(toResponse),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  }

  @GrpcMethod('ProductService', 'GetBatchById')
  async getById(data: { batch_id: string }) {
    const batch = await this.service.findById(data.batch_id);
    return toResponse(batch);
  }

  @GrpcMethod('ProductService', 'GetBatchByCode')
  async getByCode(data: { batch_code: string }) {
    const batch = await this.service.findByCode(data.batch_code);
    return toResponse(batch);
  }

  @GrpcMethod('ProductService', 'CheckBatchOwnership')
  async checkBatchOwnership(data: { user_id: string; batch_id: string }) {
    const allowed = await this.service.checkOwnership(data.user_id, data.batch_id);
    return { allowed };
  }

  @GrpcMethod('ProductService', 'TransitionBatchStatus')
  async transitionStatus(data: AuthData & Record<string, any>) {
    const caller = data.__auth ?? { userId: null, role: null };
    const batch = await this.service.transitionStatus(data.id, data as any, caller);
    return toResponse(batch);
  }
}
