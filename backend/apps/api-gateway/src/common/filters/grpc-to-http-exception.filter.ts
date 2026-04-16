import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { status as GrpcStatus } from '@grpc/grpc-js';

const GRPC_TO_HTTP: Record<number, number> = {
  [GrpcStatus.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
  [GrpcStatus.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
  [GrpcStatus.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
  [GrpcStatus.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [GrpcStatus.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [GrpcStatus.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
  [GrpcStatus.INTERNAL]: HttpStatus.INTERNAL_SERVER_ERROR,
  [GrpcStatus.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [GrpcStatus.UNKNOWN]: HttpStatus.INTERNAL_SERVER_ERROR,
};

@Catch()
export class GrpcToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // Nếu đã là HTTP exception thông thường (guard/validation pipe) → xử lý mặc định
    if (exception?.getStatus && typeof exception.getStatus === 'function') {
      const status = exception.getStatus();
      const response = exception.getResponse();
      return res.status(status).json(
        typeof response === 'string' ? { statusCode: status, message: response } : response,
      );
    }

    // gRPC error từ microservice: có field `code` (gRPC status) và `details`/`message`
    const grpcCode = exception?.code;
    const grpcMessage = exception?.details || exception?.message || 'Internal server error';

    if (typeof grpcCode === 'number' && grpcCode in GRPC_TO_HTTP) {
      const httpStatus = GRPC_TO_HTTP[grpcCode];
      return res.status(httpStatus).json({
        statusCode: httpStatus,
        message: grpcMessage,
      });
    }

    // Fallback
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    return res.status(status).json({
      statusCode: status,
      message: grpcMessage,
    });
  }
}
