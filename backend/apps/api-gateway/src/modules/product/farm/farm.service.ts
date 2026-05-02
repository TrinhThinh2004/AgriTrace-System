import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { withAuthMetadata } from '../../../common/grpc/with-auth-metadata';

interface ProductServiceGrpc {
  createFarm(data: any, metadata?: any): Observable<any>;
  updateFarm(data: any, metadata?: any): Observable<any>;
  deleteFarm(data: any, metadata?: any): Observable<any>;
  getFarmById(data: any, metadata?: any): Observable<any>;
  listFarms(data: any, metadata?: any): Observable<any>;
  requestCertification(data: any, metadata?: any): Observable<any>;
  approveCertification(data: any, metadata?: any): Observable<any>;
  rejectCertification(data: any, metadata?: any): Observable<any>;
}

@Injectable()
export class FarmService implements OnModuleInit {
  private grpc!: ProductServiceGrpc;

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.grpc = this.client.getService<ProductServiceGrpc>('ProductService');
  }

  create(dto: Record<string, any>, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.createFarm(dto, withAuthMetadata(user)),
    );
  }

  update(id: string, dto: Record<string, any>, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.updateFarm({ id, ...dto }, withAuthMetadata(user)),
    );
  }

  delete(id: string, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.deleteFarm({ id }, withAuthMetadata(user)),
    );
  }

  findById(farmId: string, user: { id: string; role: string }) {
    return firstValueFrom(
      this.grpc.getFarmById({ farm_id: farmId }, withAuthMetadata(user)),
    );
  }

  list(
    query: {
      owner_id?: string;
      status?: string;
      certification_status?: string;
      page?: number;
      limit?: number;
    },
    user: { id: string; role: string },
  ) {
    return firstValueFrom(
      this.grpc.listFarms(query, withAuthMetadata(user)),
    );
  }

  requestCertification(
    farmId: string,
    requestedType: string,
    user: { id: string; role: string },
  ) {
    return firstValueFrom(
      this.grpc.requestCertification(
        { farm_id: farmId, requested_type: requestedType },
        withAuthMetadata(user),
      ),
    );
  }

  approveCertification(
    farmId: string,
    user: { id: string; role: string },
    grantedType?: string,
  ) {
    return firstValueFrom(
      this.grpc.approveCertification(
        { farm_id: farmId, granted_type: grantedType ?? '' },
        withAuthMetadata(user),
      ),
    );
  }

  rejectCertification(
    farmId: string,
    reason: string,
    user: { id: string; role: string },
  ) {
    return firstValueFrom(
      this.grpc.rejectCertification(
        { farm_id: farmId, reason },
        withAuthMetadata(user),
      ),
    );
  }
}
