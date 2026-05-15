import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CertificationService } from './certification.service';
import { ChecklistResponse } from '../entities/checklist-response.entity';
import { ChecklistResponseItem } from '../entities/checklist-response-item.entity';
import { GrpcAuthContext, GrpcAuthInterceptor } from '../common/grpc-auth.interceptor';
import { GrpcExceptionFilter } from '../common/grpc-exception.filter';
import { templateToResponse } from './template.controller';

interface AuthData {
  __auth?: GrpcAuthContext;
}

function responseItemToDto(it: ChecklistResponseItem) {
  return {
    id: it.id,
    response_id: it.response_id,
    item_id: it.item_id,
    answer: it.answer ?? '',
    evidence_asset_ids: Array.isArray(it.evidence_asset_ids) ? it.evidence_asset_ids : [],
    created_at: it.created_at?.toISOString() ?? '',
    updated_at: it.updated_at?.toISOString() ?? '',
  };
}

function emptyResponseDto() {
  // gRPC không serialize được null cho message → trả sentinel rỗng,
  // api-gateway sẽ convert lại thành null trước khi trả FE.
  return {
    id: '',
    farm_id: '',
    template_id: '',
    status: '',
    submitted_at: '',
    reviewed_at: '',
    reviewed_by: '',
    notes: '',
    created_at: '',
    updated_at: '',
    items: [] as ReturnType<typeof responseItemToDto>[],
    template: undefined,
  };
}

function responseToDto(r: ChecklistResponse | null) {
  if (!r) return emptyResponseDto();
  return {
    id: r.id,
    farm_id: r.farm_id,
    template_id: r.template_id,
    status: r.status,
    submitted_at: r.submitted_at?.toISOString() ?? '',
    reviewed_at: r.reviewed_at?.toISOString() ?? '',
    reviewed_by: r.reviewed_by ?? '',
    notes: r.notes ?? '',
    created_at: r.created_at?.toISOString() ?? '',
    updated_at: r.updated_at?.toISOString() ?? '',
    items: (r.items ?? []).map(responseItemToDto),
    template: r.template ? templateToResponse(r.template) : undefined,
  };
}

@Controller()
@UseInterceptors(GrpcAuthInterceptor)
@UseFilters(new GrpcExceptionFilter())
export class ChecklistController {
  constructor(private readonly service: CertificationService) {}

  @GrpcMethod('ProductService', 'StartChecklistResponse')
  async start(data: AuthData & { farm_id: string; template_id: string }) {
    const caller = data.__auth ?? { userId: null, role: null };
    const r = await this.service.startResponse(data.farm_id, data.template_id, caller);
    return responseToDto(r);
  }

  @GrpcMethod('ProductService', 'UpsertChecklistAnswer')
  async upsert(
    data: AuthData & {
      response_id: string;
      item_id: string;
      answer: string;
      evidence_asset_ids: string[];
    },
  ) {
    const caller = data.__auth ?? { userId: null, role: null };
    const row = await this.service.upsertAnswer(
      data.response_id,
      data.item_id,
      data.answer,
      data.evidence_asset_ids ?? [],
      caller,
    );
    return responseItemToDto(row);
  }

  @GrpcMethod('ProductService', 'SubmitChecklistResponse')
  async submit(data: AuthData & { response_id: string }) {
    const caller = data.__auth ?? { userId: null, role: null };
    const r = await this.service.submitResponse(data.response_id, caller);
    return responseToDto(r);
  }

  @GrpcMethod('ProductService', 'GetLatestChecklistByFarm')
  async getLatest(data: AuthData & { farm_id: string }) {
    const caller = data.__auth ?? { userId: null, role: null };
    const r = await this.service.getLatestByFarm(data.farm_id, caller);
    return responseToDto(r);
  }

  @GrpcMethod('ProductService', 'GetChecklistResponseById')
  async getById(data: AuthData & { response_id: string }) {
    const caller = data.__auth ?? { userId: null, role: null };
    const r = await this.service.getResponseById(data.response_id, caller);
    return responseToDto(r);
  }

  @GrpcMethod('ProductService', 'ApproveChecklistResponse')
  async approve(
    data: AuthData & { response_id: string; granted_type?: string; notes?: string },
  ) {
    const caller = data.__auth ?? { userId: null, role: null };
    const r = await this.service.approveResponse(
      data.response_id,
      data.granted_type,
      data.notes,
      caller,
    );
    return responseToDto(r);
  }

  @GrpcMethod('ProductService', 'RejectChecklistResponse')
  async reject(
    data: AuthData & { response_id: string; reason: string; notes?: string },
  ) {
    const caller = data.__auth ?? { userId: null, role: null };
    const r = await this.service.rejectResponse(
      data.response_id,
      data.reason,
      data.notes,
      caller,
    );
    return responseToDto(r);
  }
}
