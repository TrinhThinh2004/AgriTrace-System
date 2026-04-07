import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

export interface GrpcAuthContext {
  userId: string | null;
  role: string | null;
}

// Interceptor để chuyển thông tin auth từ gRPC Metadata vào payload data,
// giúp các service dễ dàng truy cập mà không cần phụ thuộc vào gRPC Metadata trực tiếp.
@Injectable()
// dùng GrpcAuthInterceptor để chuyển về context giống data dễ maintain và tái sử dụng
export class GrpcAuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'rpc') return next.handle();

    const rpcCtx = context.switchToRpc();
    // gRPC: arg thứ 2 là Metadata
    const metadata = rpcCtx.getContext<Metadata>();

    const userId = (metadata?.get?.('x-user-id')?.[0] as string) || null;
    const role = (metadata?.get?.('x-user-role')?.[0] as string) || null;

    // Gắn vào data payload 
    const data: any = rpcCtx.getData();
    if (data && typeof data === 'object') {
      data.__auth = { userId, role } as GrpcAuthContext;
    }

    return next.handle();
  }
}
