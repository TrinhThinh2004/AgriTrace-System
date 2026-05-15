import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CertificationService } from './certification.service';
import { CertificationTemplate } from '../entities/certification-template.entity';
import { ChecklistItem } from '../entities/checklist-item.entity';
import { GrpcAuthContext, GrpcAuthInterceptor } from '../common/grpc-auth.interceptor';
import { GrpcExceptionFilter } from '../common/grpc-exception.filter';

interface AuthData {
  __auth?: GrpcAuthContext;
}

function itemToDto(it: ChecklistItem) {
  return {
    id: it.id,
    template_id: it.template_id,
    order: it.order ?? 0,
    category: it.category,
    code: it.code,
    title: it.title,
    description: it.description ?? '',
    required: it.required,
    evidence_required: it.evidence_required,
  };
}

export function templateToResponse(tpl: CertificationTemplate) {
  return {
    id: tpl.id,
    code: tpl.code,
    name: tpl.name,
    cert_type: tpl.cert_type,
    version: tpl.version,
    active: tpl.active,
    description: tpl.description ?? '',
    created_at: tpl.created_at?.toISOString() ?? '',
    updated_at: tpl.updated_at?.toISOString() ?? '',
    items: (tpl.items ?? []).map(itemToDto),
  };
}

@Controller()
@UseInterceptors(GrpcAuthInterceptor)
@UseFilters(new GrpcExceptionFilter())
export class CertTemplateController {
  constructor(private readonly service: CertificationService) {}

  @GrpcMethod('ProductService', 'CreateCertificationTemplate')
  async create(data: AuthData & Record<string, any>) {
    const caller = data.__auth ?? { userId: null, role: null };
    const tpl = await this.service.createTemplate(data as any, caller);
    return templateToResponse(tpl);
  }

  @GrpcMethod('ProductService', 'UpdateCertificationTemplate')
  async update(data: AuthData & { id: string; name?: string; description?: string; active?: boolean }) {
    const caller = data.__auth ?? { userId: null, role: null };
    const tpl = await this.service.updateTemplate(data.id, data, caller);
    return templateToResponse(tpl);
  }

  @GrpcMethod('ProductService', 'ListCertificationTemplates')
  async list(data: { cert_type?: string; active_only?: boolean; page?: number; limit?: number }) {
    const result = await this.service.listTemplates(data ?? {});
    return {
      items: result.items.map(templateToResponse),
      pagination: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @GrpcMethod('ProductService', 'GetCertificationTemplate')
  async get(data: { id?: string; code?: string }) {
    const tpl = await this.service.getTemplate(data?.id, data?.code);
    return templateToResponse(tpl);
  }
}
