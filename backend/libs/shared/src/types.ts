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

// Audit action codes — used as `action` field in audit_logs table.
// Naming: <DOMAIN>_<EVENT> uppercase, stable identifiers (don't rename without migration).
export const AUDIT_ACTIONS = {
  // Auth / session
  USER_REGISTERED:        'USER_REGISTERED',
  USER_LOGIN:             'USER_LOGIN',
  USER_LOGOUT:            'USER_LOGOUT',
  USER_PROFILE_UPDATED:   'USER_PROFILE_UPDATED',
  JWT_KEY_ROTATED:        'JWT_KEY_ROTATED',
  // User admin CRUD
  USER_CREATED:           'USER_CREATED',
  USER_UPDATED:           'USER_UPDATED',
  USER_DELETED:           'USER_DELETED',
  USER_KEY_GENERATED:     'USER_KEY_GENERATED',
  USER_KEY_REVOKED:       'USER_KEY_REVOKED',
  // Farm
  FARM_CREATED:           'FARM_CREATED',
  FARM_UPDATED:           'FARM_UPDATED',
  FARM_DELETED:           'FARM_DELETED',
  CERT_REQUESTED:         'CERT_REQUESTED',
  CERT_APPROVED:          'CERT_APPROVED',
  CERT_REJECTED:          'CERT_REJECTED',
  // Crop
  CROP_CREATED:           'CROP_CREATED',
  CROP_UPDATED:           'CROP_UPDATED',
  CROP_DELETED:           'CROP_DELETED',
  // Batch
  BATCH_CREATED:          'BATCH_CREATED',
  BATCH_UPDATED:          'BATCH_UPDATED',
  BATCH_DELETED:          'BATCH_DELETED',
  BATCH_STATUS_CHANGED:   'BATCH_STATUS_CHANGED',
  // Activity log
  ACTIVITY_CREATED:       'ACTIVITY_CREATED',
  ACTIVITY_UPDATED:       'ACTIVITY_UPDATED',
  ACTIVITY_DELETED:       'ACTIVITY_DELETED',
  ACTIVITY_SIGNED:        'ACTIVITY_SIGNED',
  // Inspection
  INSPECTION_CREATED:     'INSPECTION_CREATED',
  INSPECTION_UPDATED:     'INSPECTION_UPDATED',
  INSPECTION_DELETED:     'INSPECTION_DELETED',
  INSPECTION_SIGNED:      'INSPECTION_SIGNED',
  // Media
  MEDIA_UPLOADED:         'MEDIA_UPLOADED',
  MEDIA_DELETED:          'MEDIA_DELETED',
} as const;

export type AuditActionCode = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
