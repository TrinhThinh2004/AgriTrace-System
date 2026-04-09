import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { withAuthMetadata } from '../../../common/grpc/with-auth-metadata';

interface ProductServiceGrpc {
  createBatch(data: any, metadata?: any): Observable<any>;
  updateBatch(data: any, metadata?: any): Observable<any>;
  deleteBatch(data: any, metadata?: any): Observable<any>;
  getBatchById(data: any, metadata?: any): Observable<any>;
  listBatches(data: any, metadata?: any): Observable<any>;
  transitionBatchStatus(data: any, metadata?: any): Observable<any>;
}

@Injectable()
export class BatchService implements OnModuleInit {
  private grpc: ProductServiceGrpc;

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.grpc = this.client.getService<ProductServiceGrpc>('ProductService');
  }

  create(dto: Record<string, any>, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.createBatch(dto, withAuthMetadata(user)),
    );
  }

  update(id: string, dto: Record<string, any>, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.updateBatch({ id, ...dto }, withAuthMetadata(user)),
    );
  }

  delete(id: string, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.deleteBatch({ id }, withAuthMetadata(user)),
    );
  }

  findById(batchId: string, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.getBatchById({ batch_id: batchId }, withAuthMetadata(user)),
    );
  }

  list(
    query: { farm_id?: string; status?: string; page?: number; limit?: number },
    user: { id: string; role: string },
  ) {
    return firstValueFrom(
      this.grpc.listBatches(query, withAuthMetadata(user)),
    );
  }

  transitionStatus(
    id: string,
    dto: Record<string, any>,
    user: { id: string; role: string },
  ) {
    return firstValueFrom(
      this.grpc.transitionBatchStatus({ id, ...dto }, withAuthMetadata(user)),
    );
  }
}
