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
  createActivityLog(data: any, metadata?: any): Observable<any>;
  updateActivityLog(data: any, metadata?: any): Observable<any>;
  deleteActivityLog(data: any, metadata?: any): Observable<any>;
  getActivityLogById(data: any, metadata?: any): Observable<any>;
  getActivityLogsByBatch(data: any, metadata?: any): Observable<any>;
  listActivityLogs(data: any, metadata?: any): Observable<any>;
  signActivityLog(data: any, metadata?: any): Observable<any>;
}

interface ProductServiceGrpc {
  checkBatchOwnership(data: {
    user_id: string;
    batch_id: string;
  }): Observable<{ allowed: boolean }>;
}

type AuthUser = { id: string; role: string };

@Injectable()
export class ActivityLogService implements OnModuleInit {
  private trace: TraceServiceGrpc;
  private product: ProductServiceGrpc;

  constructor(
    @Inject('TRACE_SERVICE') private readonly traceClient: ClientGrpc,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.trace = this.traceClient.getService<TraceServiceGrpc>('TraceService');
    this.product =
      this.productClient.getService<ProductServiceGrpc>('ProductService');
  }

  // ADMIN bypass; còn lại phải sở hữu batch chứa log
  private async assertOwnsBatch(user: AuthUser, batchId: string) {
    if (user.role === Role.ADMIN) return;
    const { allowed } = await firstValueFrom(
      this.product.checkBatchOwnership({
        user_id: user.id,
        batch_id: batchId,
      }),
    );
    if (!allowed) {
      throw new ForbiddenException('Không có quyền trên activity log này');
    }
  }

  create(batchId: string, dto: Record<string, any>, user: AuthUser) {
    return firstValueFrom(
      this.trace.createActivityLog(
        {
          ...dto,
          batch_id: batchId,
          performed_by: user.id,
        },
        withAuthMetadata(user),
      ),
    );
  }

  async update(id: string, dto: Record<string, any>, user: AuthUser) {
    const current = await firstValueFrom(
      this.trace.getActivityLogById({ id }, withAuthMetadata(user)),
    );
    await this.assertOwnsBatch(user, current.batch_id);
    return firstValueFrom(
      this.trace.updateActivityLog({ id, ...dto }, withAuthMetadata(user)),
    );
  }

  async delete(id: string, user: AuthUser) {
    const current = await firstValueFrom(
      this.trace.getActivityLogById({ id }, withAuthMetadata(user)),
    );
    await this.assertOwnsBatch(user, current.batch_id);
    return firstValueFrom(
      this.trace.deleteActivityLog({ id }, withAuthMetadata(user)),
    );
  }

  async sign(
    id: string,
    dto: { digital_signature: string; signed_at: string },
    user: AuthUser,
  ) {
    const current = await firstValueFrom(
      this.trace.getActivityLogById({ id }, withAuthMetadata(user)),
    );
    await this.assertOwnsBatch(user, current.batch_id);
    return firstValueFrom(
      this.trace.signActivityLog({ id, ...dto }, withAuthMetadata(user)),
    );
  }

  findById(id: string, user?: AuthUser) {
    return firstValueFrom(
      this.trace.getActivityLogById(
        { id },
        user ? withAuthMetadata(user) : undefined,
      ),
    );
  }

  listByBatch(batchId: string, user?: AuthUser) {
    return firstValueFrom(
      this.trace.getActivityLogsByBatch(
        { batch_id: batchId },
        user ? withAuthMetadata(user) : undefined,
      ),
    );
  }

  list(
    query: {
      batch_id?: string;
      activity_type?: string;
      performed_by?: string;
      page?: number;
      limit?: number;
    },
    user: AuthUser,
  ) {
    return firstValueFrom(
      this.trace.listActivityLogs(query, withAuthMetadata(user)),
    );
  }
}
