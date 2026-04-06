import { Role } from './enums';

// ========================
// JWT / Auth Types
// ========================
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

// ========================
// gRPC — User-Service Interface
// Dùng để type-check gRPC calls từ các service khác
// ========================
export interface UserGrpcDto {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
}

export interface GetUserByIdRequest {
  user_id: string;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  payload?: JwtPayload;
}

// ========================
// gRPC — Product-Service Interface
// ========================
export interface BatchGrpcDto {
  id: string;
  batch_code: string;
  farm_id: string;
  crop_category_id: string;
  status: string;
  created_by: string;
}

export interface GetBatchByIdRequest {
  batch_id: string;
}

// ========================
// RabbitMQ Event Payloads
// ========================
export interface AuditEventPayload {
  entity_type: string;
  entity_id: string;
  action: string;         // AuditAction
  actor_id: string;
  actor_role: string;
  before_data?: object;
  after_data?: object;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;      // ISO string
}

// Event names (RabbitMQ routing keys)
export const AUDIT_EVENTS = {
  USER_REGISTERED:    'user.registered',
  USER_ROLE_CHANGED:  'user.role_changed',
  USER_SUSPENDED:     'user.suspended',
  BATCH_CREATED:      'batch.created',
  BATCH_STATUS_CHANGED: 'batch.status_changed',
  ACTIVITY_CREATED:   'activity.created',
  INSPECTION_SIGNED:  'inspection.signed',
  QR_GENERATED:       'qr.generated',
} as const;

// RabbitMQ Queue names
export const QUEUES = {
  AUDIT_EVENTS: 'audit.events',
} as const;
