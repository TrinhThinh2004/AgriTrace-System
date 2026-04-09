import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FarmService } from './farm.service';
import { Farm } from '../entities/farm.entity';
import { GrpcAuthContext } from '../common/grpc-auth.interceptor';

function toResponse(farm: Farm) {
  return {
    id: farm.id,
    owner_id: farm.owner_id,
    name: farm.name,
    address: farm.address ?? '',
    location_lat: farm.location_lat != null ? String(farm.location_lat) : '',
    location_long: farm.location_long != null ? String(farm.location_long) : '',
    area_hectares: farm.area_hectares != null ? String(farm.area_hectares) : '',
    certification_status: farm.certification_status,
    status: farm.status,
    created_at: farm.created_at?.toISOString() ?? '',
    updated_at: farm.updated_at?.toISOString() ?? '',
  };
}

interface AuthData {
  __auth?: GrpcAuthContext;
}
// Controller chỉ nhận gRPC request, không có HTTP endpoint
@Controller()
export class FarmController {
  constructor(private readonly service: FarmService) {}

  @GrpcMethod('ProductService', 'CreateFarm')
  async create(data: AuthData & Record<string, any>) {
    const caller = data.__auth ?? { userId: null, role: null };
    const farm = await this.service.create(data as any, caller);
    return toResponse(farm);
  }

  @GrpcMethod('ProductService', 'UpdateFarm')
  async update(data: { id: string } & Record<string, any>) {
    const farm = await this.service.update(data.id, data as any);
    return toResponse(farm);
  }

  @GrpcMethod('ProductService', 'DeleteFarm')
  async delete(data: { id: string }) {
    await this.service.delete(data.id);
    return {};
  }

  @GrpcMethod('ProductService', 'GetFarmById')
  async getById(data: { farm_id: string }) {
    const farm = await this.service.findById(data.farm_id);
    return toResponse(farm);
  }

  @GrpcMethod('ProductService', 'CheckFarmOwnership')
  async checkFarmOwnership(data: { user_id: string; farm_id: string }) {
    const allowed = await this.service.checkOwnership(data.user_id, data.farm_id);
    return { allowed };
  }

  @GrpcMethod('ProductService', 'ListFarms')
  async list(data: {
    owner_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
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
