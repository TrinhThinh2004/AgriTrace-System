import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FarmService } from './farm.service';
import { Farm } from '../entities/farm.entity';
import { GrpcAuthContext, GrpcAuthInterceptor } from '../common/grpc-auth.interceptor';
import { GrpcExceptionFilter } from '../common/grpc-exception.filter';

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
    requested_certification_type: farm.requested_certification_type ?? '',
    certified_at: farm.certified_at?.toISOString() ?? '',
    certified_by: farm.certified_by ?? '',
    reject_reason: farm.reject_reason ?? '',
  };
}

interface AuthData {
  __auth?: GrpcAuthContext;
}

// Controller chỉ nhận gRPC request, không có HTTP endpoint
@Controller()
@UseInterceptors(GrpcAuthInterceptor)
@UseFilters(new GrpcExceptionFilter())
export class FarmController {
  constructor(private readonly service: FarmService) { }

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
  async list(data: AuthData & {
    owner_id?: string;
    status?: string;
    certification_status?: string;
    page?: number;
    limit?: number;
  }) {
    const caller = data.__auth ?? { userId: null, role: null };
    const owner_id =
      caller.role === 'FARMER'
        ? caller.userId ?? data.owner_id
        : data.owner_id;
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

  @GrpcMethod('ProductService', 'RequestCertification')
  async requestCertification(
    data: AuthData & { farm_id: string; requested_type: string },
  ) {
    const caller = data.__auth ?? { userId: null, role: null };
    const farm = await this.service.requestCertification(
      data.farm_id,
      data.requested_type,
      caller,
    );
    return toResponse(farm);
  }

  @GrpcMethod('ProductService', 'ApproveCertification')
  async approveCertification(
    data: AuthData & { farm_id: string; granted_type?: string },
  ) {
    const caller = data.__auth ?? { userId: null, role: null };
    const farm = await this.service.approveCertification(
      data.farm_id,
      caller,
      data.granted_type,
    );
    return toResponse(farm);
  }

  @GrpcMethod('ProductService', 'RejectCertification')
  async rejectCertification(
    data: AuthData & { farm_id: string; reason: string },
  ) {
    const caller = data.__auth ?? { userId: null, role: null };
    const farm = await this.service.rejectCertification(
      data.farm_id,
      data.reason,
      caller,
    );
    return toResponse(farm);
  }
}
