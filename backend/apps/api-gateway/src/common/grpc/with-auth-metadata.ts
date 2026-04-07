import { Metadata } from '@grpc/grpc-js';

/**
 * Tạo gRPC Metadata chứa thông tin user hiện tại để forward
 * từ API Gateway xuống các microservice.
 */
export function withAuthMetadata(user: {
  id: string;
  role: string;
}): Metadata {
  const md = new Metadata();
  md.add('x-user-id', user.id);
  md.add('x-user-role', user.role);
  return md;
}
