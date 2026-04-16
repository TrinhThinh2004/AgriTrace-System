import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ActivityLogService } from './activity-log.service';
import { ActivityLog } from '../entities/activity-log.entity';
import { GrpcAuthContext, GrpcAuthInterceptor } from '../common/grpc-auth.interceptor';
import { GrpcExceptionFilter } from '../common/grpc-exception.filter';

function toResponse(l: ActivityLog) {
  return {
    id: l.id,
    batch_id: l.batch_id,
    activity_type: l.activity_type,
    performed_by: l.performed_by,
    performed_at: l.performed_at?.toISOString?.() ?? '',
    location: l.location ?? '',
    notes: l.notes ?? '',
    inputs_used: Array.isArray(l.inputs_used) ? (l.inputs_used as any[]) : [],
    is_signed: !!l.digital_signature,
    signed_at: l.signed_at?.toISOString?.() ?? '',
    created_at: l.created_at?.toISOString?.() ?? '',
  };
}




interface AuthData {
  __auth?: GrpcAuthContext;
}

@Controller()
@UseInterceptors(GrpcAuthInterceptor)
@UseFilters(new GrpcExceptionFilter())
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) { }

  @GrpcMethod('TraceService', 'CreateActivityLog')
  async create(data: AuthData & Record<string, any>) {
    const caller = data.__auth ?? { userId: null, role: null };
    const log = await this.service.create(data as any, caller);
    return toResponse(log);
  }

  @GrpcMethod('TraceService', 'UpdateActivityLog')
  async update(data: { id: string } & Record<string, any>) {
    const log = await this.service.update(data.id, data as any);
    return toResponse(log);
  }

  @GrpcMethod('TraceService', 'DeleteActivityLog')
  async delete(data: { id: string }) {
    await this.service.delete(data.id);
    return {};
  }

  @GrpcMethod('TraceService', 'GetActivityLogById')
  async getById(data: { id: string }) {
    const log = await this.service.findById(data.id);
    return toResponse(log);
  }

  @GrpcMethod('TraceService', 'GetActivityLogsByBatch')
  async getByBatch(data: { batch_id: string }) {
    const logs = await this.service.findByBatch(data.batch_id);
    return { logs: logs.map(toResponse) };
  }

  @GrpcMethod('TraceService', 'ListActivityLogs')
  async list(data: {
    batch_id?: string;
    activity_type?: string;
    performed_by?: string;
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

  @GrpcMethod('TraceService', 'SignActivityLog')
  async sign(data: { id: string; digital_signature: string; signed_at: string }) {
    const log = await this.service.sign(data.id, {
      digital_signature: data.digital_signature,
      signed_at: data.signed_at,
    });
    return toResponse(log);
  }
}
