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
import { SignatureVerifyService } from '../../../common/services/signature-verify.service';

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
  private trace!: TraceServiceGrpc;
  private product!: ProductServiceGrpc;

  constructor(
    @Inject('TRACE_SERVICE') private readonly traceClient: ClientGrpc,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientGrpc,
    private readonly signatureService: SignatureVerifyService,
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
  // Chỉ người sở hữu batch chứa log (hoặc ADMIN) mới được sửa/xoá/ký
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
  // update/delete/sign đều cần check quyền trên batch chứa log trước, tránh trường hợp user có thể thao tác trên log của batch khác
  async update(id: string, dto: Record<string, any>, user: AuthUser) {
    const current = await firstValueFrom(
      this.trace.getActivityLogById({ id }, withAuthMetadata(user)),
    );
    await this.assertOwnsBatch(user, current.batch_id);
    return firstValueFrom(
      this.trace.updateActivityLog({ id, ...dto }, withAuthMetadata(user)),
    );
  }
  // delete cũng cần check quyền trên batch chứa log trước, tránh trường hợp user có thể thao tác trên log của batch khác
  async delete(id: string, user: AuthUser) {
    const current = await firstValueFrom(
      this.trace.getActivityLogById({ id }, withAuthMetadata(user)),
    );
    await this.assertOwnsBatch(user, current.batch_id);
    return firstValueFrom(
      this.trace.deleteActivityLog({ id }, withAuthMetadata(user)),
    );
  }
  // ký cũng cần check quyền trên batch chứa log trước, tránh trường hợp user có thể thao tác trên log của batch khác
  async sign(
    id: string,
    dto: { digital_signature: string; signed_at: string; signer_key_id: string },
    user: AuthUser,
  ) {
    const current = await firstValueFrom(
      this.trace.getActivityLogById({ id }, withAuthMetadata(user)),
    );
    await this.assertOwnsBatch(user, current.batch_id);

    // Verify chữ ký số bằng public key trước khi forward
    const canonical =
      this.signatureService.buildActivityLogCanonical(current);
    await this.signatureService.verifySignature({
      signer_key_id: dto.signer_key_id,
      digital_signature: dto.digital_signature,
      canonical_data: canonical,
      expected_user_id: user.id,
    });

    return firstValueFrom(
      this.trace.signActivityLog({ id, ...dto }, withAuthMetadata(user)),
    );
  }
  // ADMIN có thể xem tất cả log; còn lại phải sở hữu batch chứa log mới xem được
  findById(id: string, user?: AuthUser) {
    const args: [any, ...any[]] = [{ id }];
    if (user) args.push(withAuthMetadata(user));
    return firstValueFrom(this.trace.getActivityLogById(...args));
  }
  // ADMIN có thể xem tất cả log; còn lại phải sở hữu batch chứa log mới xem được
  listByBatch(batchId: string, user?: AuthUser) {
    const args: [any, ...any[]] = [{ batch_id: batchId }];
    if (user) args.push(withAuthMetadata(user));
    return firstValueFrom(this.trace.getActivityLogsByBatch(...args));
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
