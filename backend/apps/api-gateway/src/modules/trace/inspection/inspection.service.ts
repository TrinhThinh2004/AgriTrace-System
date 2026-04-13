import {
  Injectable,
  Inject,
  OnModuleInit,
  ForbiddenException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { withAuthMetadata } from '../../../common/grpc/with-auth-metadata';
import { Role } from '../../../common/enums';

interface TraceServiceGrpc {
  createInspection(data: any, metadata?: any): Observable<any>;
  updateInspection(data: any, metadata?: any): Observable<any>;
  deleteInspection(data: any, metadata?: any): Observable<any>;
  getInspectionById(data: any, metadata?: any): Observable<any>;
  getInspectionsByBatch(data: any, metadata?: any): Observable<any>;
  listInspections(data: any, metadata?: any): Observable<any>;
  signInspection(data: any, metadata?: any): Observable<any>;
}

type AuthUser = { id: string; role: string };

@Injectable()
export class InspectionService implements OnModuleInit {
  private trace!: TraceServiceGrpc;

  constructor(
    @Inject('TRACE_SERVICE') private readonly traceClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.trace = this.traceClient.getService<TraceServiceGrpc>('TraceService');
  }

  // Chỉ inspector sở hữu bản ghi (hoặc ADMIN) mới được sửa/xoá/ký
  private async assertOwnsInspection(user: AuthUser, inspectionId: string) {
    if (user.role === Role.ADMIN) return;
    const current = await firstValueFrom(
      this.trace.getInspectionById({ id: inspectionId }, withAuthMetadata(user)),
    );
    if (current.inspector_id !== user.id) {
      throw new ForbiddenException(
        'Không có quyền trên inspection này (không phải người kiểm định)',
      );
    }
    return current;
  }

  create(batchId: string, dto: Record<string, any>, user: AuthUser) {
    return firstValueFrom(
      this.trace.createInspection(
        {
          ...dto,
          batch_id: batchId,
          inspector_id: user.id,
        },
        withAuthMetadata(user),
      ),
    );
  }

  async update(id: string, dto: Record<string, any>, user: AuthUser) {
    await this.assertOwnsInspection(user, id);
    return firstValueFrom(
      this.trace.updateInspection({ id, ...dto }, withAuthMetadata(user)),
    );
  }

  async delete(id: string, user: AuthUser) {
    await this.assertOwnsInspection(user, id);
    return firstValueFrom(
      this.trace.deleteInspection({ id }, withAuthMetadata(user)),
    );
  }

  async sign(
    id: string,
    dto: { digital_signature: string; signed_at: string },
    user: AuthUser,
  ) {
    await this.assertOwnsInspection(user, id);
    return firstValueFrom(
      this.trace.signInspection({ id, ...dto }, withAuthMetadata(user)),
    );
  }

  findById(id: string, user?: AuthUser) {
    return firstValueFrom(
      this.trace.getInspectionById(
        { id },
        user ? withAuthMetadata(user) : undefined,
      ),
    );
  }

  listByBatch(batchId: string, user?: AuthUser) {
    return firstValueFrom(
      this.trace.getInspectionsByBatch(
        { batch_id: batchId },
        user ? withAuthMetadata(user) : undefined,
      ),
    );
  }

  list(
    query: {
      batch_id?: string;
      inspector_id?: string;
      inspection_type?: string;
      result?: string;
      page?: number;
      limit?: number;
    },
    user: AuthUser,
  ) {
    return firstValueFrom(
      this.trace.listInspections(query, withAuthMetadata(user)),
    );
  }
}
