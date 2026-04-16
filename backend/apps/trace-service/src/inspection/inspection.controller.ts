import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InspectionService } from './inspection.service';
import { Inspection } from '../entities/inspection.entity';
import { GrpcAuthContext, GrpcAuthInterceptor } from '../common/grpc-auth.interceptor';
import { GrpcExceptionFilter } from '../common/grpc-exception.filter';

function toResponse(i: Inspection) {
  return {
    id: i.id,
    batch_id: i.batch_id,
    inspector_id: i.inspector_id,
    inspection_type: i.inspection_type,
    result: i.result,
    scheduled_at: i.scheduled_at?.toISOString?.() ?? '',
    conducted_at: i.conducted_at?.toISOString?.() ?? '',
    notes: i.notes ?? '',
    report_url: i.report_url ?? '',
    is_signed: !!i.digital_signature,
    signed_at: i.signed_at?.toISOString?.() ?? '',
    signer_key_id: i.signer_key_id ?? '',
    created_at: i.created_at?.toISOString?.() ?? '',
    updated_at: i.updated_at?.toISOString?.() ?? '',
  };
}

interface AuthData {
  __auth?: GrpcAuthContext;
}
// InspectionController nhận các gRPC call từ API Gateway, chuyển tiếp đến InspectionService,
@Controller()
@UseInterceptors(GrpcAuthInterceptor)
@UseFilters(new GrpcExceptionFilter())
export class InspectionController {
  constructor(private readonly service: InspectionService) { }

  @GrpcMethod('TraceService', 'CreateInspection')
  async create(data: AuthData & Record<string, any>) {
    const caller = data.__auth ?? { userId: null, role: null };
    const inspection = await this.service.create(data as any, caller);
    return toResponse(inspection);
  }

  @GrpcMethod('TraceService', 'UpdateInspection')
  async update(data: { id: string } & Record<string, any>) {
    const inspection = await this.service.update(data.id, data as any);
    return toResponse(inspection);
  }

  @GrpcMethod('TraceService', 'DeleteInspection')
  async delete(data: { id: string }) {
    await this.service.delete(data.id);
    return {};
  }

  @GrpcMethod('TraceService', 'GetInspectionById')
  async getById(data: { id: string }) {
    const inspection = await this.service.findById(data.id);
    return toResponse(inspection);
  }

  @GrpcMethod('TraceService', 'GetInspectionsByBatch')
  async getByBatch(data: { batch_id: string }) {
    const list = await this.service.findByBatch(data.batch_id);
    return { inspections: list.map(toResponse) };
  }

  @GrpcMethod('TraceService', 'ListInspections')
  async list(data: {
    batch_id?: string;
    inspector_id?: string;
    inspection_type?: string;
    result?: string;
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

  @GrpcMethod('TraceService', 'SignInspection')
  async sign(data: { id: string; digital_signature: string; signed_at: string; signer_key_id: string }) {
    const inspection = await this.service.sign(data.id, {
      digital_signature: data.digital_signature,
      signed_at: data.signed_at,
      signer_key_id: data.signer_key_id,
    });
    return toResponse(inspection);
  }
}
