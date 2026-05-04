import { SetMetadata } from '@nestjs/common';

export const AUDITABLE_KEY = 'auditable';

export interface AuditableMeta {
  // tên hành động audit (ví dụ: 'Farm Created', 'Batch Updated', ...)
  action: string;
  // loại entity liên quan đến hành động này (ví dụ: 'Farm', 'Batch', ...)
  entityType: string;
  // tên param của route chứa ID của entity (ví dụ: 'id'), dùng để gắn entityId vào log
  entityIdParam?: string;
}

// Decorator @Auditable để đánh dấu các endpoint cần audit log,
//  nhận vào action và options để xác định thông tin log cần ghi

export const Auditable = (action: string, options: Omit<AuditableMeta, 'action'>) =>
  SetMetadata(AUDITABLE_KEY, { action, ...options } satisfies AuditableMeta);
