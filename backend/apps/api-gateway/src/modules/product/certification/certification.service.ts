import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { withAuthMetadata } from '../../../common/grpc/with-auth-metadata';

interface ProductServiceGrpc {
  createCertificationTemplate(data: any, metadata?: any): Observable<any>;
  updateCertificationTemplate(data: any, metadata?: any): Observable<any>;
  listCertificationTemplates(data: any, metadata?: any): Observable<any>;
  getCertificationTemplate(data: any, metadata?: any): Observable<any>;
  startChecklistResponse(data: any, metadata?: any): Observable<any>;
  upsertChecklistAnswer(data: any, metadata?: any): Observable<any>;
  submitChecklistResponse(data: any, metadata?: any): Observable<any>;
  getLatestChecklistByFarm(data: any, metadata?: any): Observable<any>;
  getChecklistResponseById(data: any, metadata?: any): Observable<any>;
  approveChecklistResponse(data: any, metadata?: any): Observable<any>;
  rejectChecklistResponse(data: any, metadata?: any): Observable<any>;
}

@Injectable()
export class CertificationService implements OnModuleInit {
  private grpc!: ProductServiceGrpc;

  constructor(@Inject('PRODUCT_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.grpc = this.client.getService<ProductServiceGrpc>('ProductService');
  }

  createTemplate(dto: Record<string, any>, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.createCertificationTemplate(dto, withAuthMetadata(user)),
    );
  }

  updateTemplate(
    id: string,
    dto: Record<string, any>,
    user: { id: string; role: string },
  ) {
    return firstValueFrom(
      this.grpc.updateCertificationTemplate({ id, ...dto }, withAuthMetadata(user)),
    );
  }

  listTemplates(query: Record<string, any>, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.listCertificationTemplates(query, withAuthMetadata(user)),
    );
  }

  getTemplate(idOrCode: { id?: string; code?: string }, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.getCertificationTemplate(idOrCode, withAuthMetadata(user)),
    );
  }

  startResponse(farmId: string, templateId: string, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.startChecklistResponse(
        { farm_id: farmId, template_id: templateId },
        withAuthMetadata(user),
      ),
    );
  }

  upsertAnswer(
    responseId: string,
    itemId: string,
    body: { answer: string; evidence_asset_ids?: string[] },
    user: { id: string; role: string },
  ) {
    return firstValueFrom(
      this.grpc.upsertChecklistAnswer(
        {
          response_id: responseId,
          item_id: itemId,
          answer: body.answer ?? '',
          evidence_asset_ids: body.evidence_asset_ids ?? [],
        },
        withAuthMetadata(user),
      ),
    );
  }

  submitResponse(responseId: string, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.submitChecklistResponse(
        { response_id: responseId },
        withAuthMetadata(user),
      ),
    );
  }

  async getLatestByFarm(farmId: string, user: { id: string; role: string }) {
    const res = await firstValueFrom(
      this.grpc.getLatestChecklistByFarm(
        { farm_id: farmId },
        withAuthMetadata(user),
      ),
    );
    // product-service trả sentinel rỗng khi chưa có response → map về null
    return res && res.id ? res : null;
  }

  getResponseById(responseId: string, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.getChecklistResponseById(
        { response_id: responseId },
        withAuthMetadata(user),
      ),
    );
  }

  approveResponse(
    responseId: string,
    body: { granted_type?: string; notes?: string },
    user: { id: string; role: string },
  ) {
    return firstValueFrom(
      this.grpc.approveChecklistResponse(
        {
          response_id: responseId,
          granted_type: body.granted_type ?? '',
          notes: body.notes ?? '',
        },
        withAuthMetadata(user),
      ),
    );
  }

  rejectResponse(
    responseId: string,
    body: { reason: string; notes?: string },
    user: { id: string; role: string },
  ) {
    return firstValueFrom(
      this.grpc.rejectChecklistResponse(
        {
          response_id: responseId,
          reason: body.reason,
          notes: body.notes ?? '',
        },
        withAuthMetadata(user),
      ),
    );
  }
}
