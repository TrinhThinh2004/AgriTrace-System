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

// Interceptor đọc x-user-id / x-user-role từ gRPC metadata và gắn vào payload data (__auth)
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
