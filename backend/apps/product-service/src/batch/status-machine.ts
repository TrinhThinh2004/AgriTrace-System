import { BatchStatus } from '@app/shared';

/**
 * Status transition graph cho Batch.
 * Tuần tự nghiêm: chỉ cho phép tiến tới state kế tiếp, không skip không lùi.
 *
 *   SEEDING → GROWING → HARVESTED → INSPECTED → PACKED → SHIPPED
 *   Gieo hạt → Trồng trọt → Thu hoạch → Kiểm tra → Đóng gói → Vận chuyển
 *   
 */
const NEXT: Record<BatchStatus, BatchStatus[]> = {
  [BatchStatus.SEEDING]: [BatchStatus.GROWING],
  [BatchStatus.GROWING]: [BatchStatus.HARVESTED],
  [BatchStatus.HARVESTED]: [BatchStatus.INSPECTED],
  [BatchStatus.INSPECTED]: [BatchStatus.PACKED],
  [BatchStatus.PACKED]: [BatchStatus.SHIPPED],
  [BatchStatus.SHIPPED]: [],
};

export function isValidTransition(from: BatchStatus, to: BatchStatus): boolean {
  return NEXT[from]?.includes(to) ?? false;
}

export function allowedNextStatuses(from: BatchStatus): BatchStatus[] {
  return NEXT[from] ?? [];
}
