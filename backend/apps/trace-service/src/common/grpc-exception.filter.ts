import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { Observable, throwError } from 'rxjs';

const HTTP_TO_GRPC: Record<number, number> = {
  400: GrpcStatus.INVALID_ARGUMENT,
  401: GrpcStatus.UNAUTHENTICATED,
  403: GrpcStatus.PERMISSION_DENIED,
  404: GrpcStatus.NOT_FOUND,
  409: GrpcStatus.ALREADY_EXISTS,
  422: GrpcStatus.INVALID_ARGUMENT,
  429: GrpcStatus.RESOURCE_EXHAUSTED,
  500: GrpcStatus.INTERNAL,
};

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  catch(exception: any): Observable<never> {
    // Already an RpcException — rethrow as-is
   if (exception instanceof RpcException) {
      const err = exception.getError();

      return throwError(() => ({
        code: err['code'] || GrpcStatus.INTERNAL,
        message: err['message'] || 'Internal error',
      }));
    }

    let grpcCode = GrpcStatus.INTERNAL;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const httpStatus = exception.getStatus();
      grpcCode = HTTP_TO_GRPC[httpStatus] ?? GrpcStatus.INTERNAL;

      const response = exception.getResponse();
      message =
        typeof response === 'string'
          ? response
          : (response as any)?.message ?? exception.message;

      // class-validator trả về mảng message
      if (Array.isArray(message)) {
        message = message.join('; ');
      }
    } else if (exception?.message) {
      message = exception.message;
    }

    return throwError(() => ({
  code: grpcCode,
  message,
}));
  }
}
