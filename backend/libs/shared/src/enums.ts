// ========================
// USER SERVICE ENUMS
// ========================
export enum Role {
  ADMIN = 'ADMIN',
  FARMER = 'FARMER',
  INSPECTOR = 'INSPECTOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// ========================
// PRODUCT SERVICE ENUMS
// ========================
export enum CropCategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum CertificationStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  VIETGAP = 'VIETGAP',
  GLOBALGAP = 'GLOBALGAP',
  ORGANIC = 'ORGANIC',
}

export enum FarmStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum BatchStatus {
  SEEDING = 'SEEDING',
  GROWING = 'GROWING',
  HARVESTED = 'HARVESTED',
  INSPECTED = 'INSPECTED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
}

// ========================
// TRACE SERVICE ENUMS
// ========================
export enum ActivityType {
  SEEDING = 'SEEDING',
  FERTILIZING = 'FERTILIZING',
  SPRAYING = 'SPRAYING',
  WATERING = 'WATERING',
  PRUNING = 'PRUNING',
  HARVESTING = 'HARVESTING',
  PACKING = 'PACKING',
  OTHER = 'OTHER',
}

export enum InspectionType {
  FIELD_VISIT = 'FIELD_VISIT',
  LAB_TEST = 'LAB_TEST',
  DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',
  FINAL_CERTIFICATION = 'FINAL_CERTIFICATION',
}

export enum InspectionResult {
  PENDING = 'PENDING',
  PASS = 'PASS',
  FAIL = 'FAIL',
  CONDITIONAL_PASS = 'CONDITIONAL_PASS',
}

// ========================
// AUDIT ENUMS
// ========================
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

// ========================
// MEDIA ENUMS
// ========================
export enum MediaEntityType {
  ACTIVITY_LOG = 'ACTIVITY_LOG',
  INSPECTION = 'INSPECTION',
  FARM = 'FARM',
  BATCH = 'BATCH',
  USER_AVATAR = 'USER_AVATAR',
  QR_CODE = 'QR_CODE',
}
