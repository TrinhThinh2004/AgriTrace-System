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

// Đọc x-user-id / x-user-role từ gRPC metadata, gắn vào payload data (__auth).
// Identical pattern to trace-service / product-service for cross-service consistency.
@Injectable()
export class GrpcAuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'rpc') return next.handle();

    const rpcCtx = context.switchToRpc();
    const metadata = rpcCtx.getContext<Metadata>();

    const userId = (metadata?.get?.('x-user-id')?.[0] as string) || null;
    const role = (metadata?.get?.('x-user-role')?.[0] as string) || null;

    const data: any = rpcCtx.getData();
    if (data && typeof data === 'object') {
      data.__auth = { userId, role } as GrpcAuthContext;
    }

    return next.handle();
  }
}
