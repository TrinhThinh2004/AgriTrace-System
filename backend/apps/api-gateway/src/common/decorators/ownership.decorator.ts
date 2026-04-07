import { SetMetadata } from '@nestjs/common';

/**
 * Khai báo ABAC ownership check.
 * - resource: loại resource cần check ('farm' | 'batch')
 * - paramName: tên param chứa ID của resource đó trong route
 * ADMIN tự động bypass trong OwnershipGuard.
 */
export const OWNERSHIP_KEY = 'ownership';

export interface OwnershipMeta {
  resource: 'farm' | 'batch';
  paramName: string;
}

export const OwnsFarm = (paramName = 'id') =>
  SetMetadata(OWNERSHIP_KEY, { resource: 'farm', paramName } as OwnershipMeta);

export const OwnsBatch = (paramName = 'id') =>
  SetMetadata(OWNERSHIP_KEY, { resource: 'batch', paramName } as OwnershipMeta);
