import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface ProductServiceGrpc {
  createCropCategory(data: any): Observable<any>;
  updateCropCategory(data: any): Observable<any>;
  deleteCropCategory(data: any): Observable<any>;
  getCropCategoryById(data: any): Observable<any>;
  listCropCategories(data: any): Observable<any>;
}

@Injectable()
export class CropCategoryService implements OnModuleInit {
  private grpc: ProductServiceGrpc;

  constructor(
    @Inject('PRODUCT_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.grpc = this.client.getService<ProductServiceGrpc>('ProductService');
  }

  create(dto: { name: string; description?: string }) {
    return firstValueFrom(this.grpc.createCropCategory(dto));
  }

  update(id: string, dto: { name?: string; description?: string; status?: string }) {
    return firstValueFrom(this.grpc.updateCropCategory({ id, ...dto }));
  }

  delete(id: string) {
    return firstValueFrom(this.grpc.deleteCropCategory({ id }));
  }

  findById(id: string) {
    return firstValueFrom(this.grpc.getCropCategoryById({ id }));
  }

  list(query: { status?: string; page?: number; limit?: number }) {
    return firstValueFrom(this.grpc.listCropCategories(query));
  }
}
