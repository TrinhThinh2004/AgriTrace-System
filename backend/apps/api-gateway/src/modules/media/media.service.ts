import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

interface MediaServiceGrpc {
  uploadAsset(data: {
    owner_id: string;
    ref_type: string;
    ref_id?: string;
    mime: string;
    file_bytes: Buffer;
    original_filename?: string;
  }): Observable<{ asset: any }>;
  getAsset(data: { id: string }): Observable<{ asset: any }>;
  listAssets(data: {
    ref_type?: string;
    ref_id?: string;
    owner_id?: string;
    page?: number;
    limit?: number;
  }): Observable<any>;
  deleteAsset(data: {
    id: string;
    requester_id: string;
    is_admin: boolean;
  }): Observable<{ message: string }>;
}

@Injectable()
export class MediaService implements OnModuleInit {
  private grpc!: MediaServiceGrpc;

  constructor(@Inject('MEDIA_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.grpc = this.client.getService<MediaServiceGrpc>('MediaService');
  }

  upload(input: {
    owner_id: string;
    ref_type: string;
    ref_id?: string;
    mime: string;
    file_bytes: Buffer;
    original_filename?: string;
  }) {
    return firstValueFrom(this.grpc.uploadAsset(input));
  }

  get(id: string) {
    return firstValueFrom(this.grpc.getAsset({ id }));
  }

  list(params: {
    ref_type?: string;
    ref_id?: string;
    owner_id?: string;
    page?: number;
    limit?: number;
  }) {
    return firstValueFrom(this.grpc.listAssets(params));
  }

  delete(id: string, requesterId: string, isAdmin: boolean) {
    return firstValueFrom(
      this.grpc.deleteAsset({ id, requester_id: requesterId, is_admin: isAdmin }),
    );
  }
}
