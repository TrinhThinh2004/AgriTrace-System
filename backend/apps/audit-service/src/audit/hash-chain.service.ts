import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

/**
  * Bộ chuẩn hóa JSON để tính toán record_hash của audit log, đảm bảo rằng cùng một payload sẽ luôn cho ra cùng một record_hash bất kể thứ tự trường trong object.
  * Nguyên tắc:
  * - Các giá trị primitive(nguyên thủy) (string, number, boolean, null) được JSON.stringify() trực tiếp.
  * - Các object được canonicalize(chuẩn hóa) đệ quy, với các trường được sắp xếp theo thứ tự alphabet.
  * - Các array được canonicalize(chuẩn hóa) đệ quy theo thứ tự phần tử.
  * 
  * Mục đích: đảm bảo rằng cùng một payload sẽ luôn cho ra cùng một record_hash bất kể thứ tự trường trong object, giúp tăng cường tính toàn vẹn và tin cậy của hệ thống audit log.
  * 
  * Lưu ý: seq_no không được bao gồm trong payload để tính record_hash vì nó được DB tự động gán sau khi insert
  * , và thứ tự của audit log được đảm bảo thông qua chuỗi prev_hash.
 */
export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? JSON.stringify(value) : 'null';
  if (typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as object).sort();
    return (
      '{' +
      keys
        .map((k) => JSON.stringify(k) + ':' + canonicalize((value as any)[k]))
        .join(',') +
      '}'
    );
  }
  return 'null';
}

export const ZERO_HASH = '0'.repeat(64);

@Injectable()
export class HashChainService {
  /**
    * Tính toán record_hash cho một audit log mới dựa trên prev_hash và payload.
    * prev_hash: record_hash của audit log trước đó trong chuỗi (hoặc ZERO_HASH nếu đây là log đầu tiên)
    * payload: phần dữ liệu của audit log (không bao gồm seq_no và prev_hash)
    * Trả về: record_hash mới được tính toán bằng cách hash prev_hash và payload đã được canonicalize.
   */
  computeRecordHash(prevHash: string, payload: ChainPayload): string {
    const canonical = canonicalize(payload);
    return createHash('sha256').update(prevHash).update(canonical).digest('hex');
  }
}

export interface ChainPayload {
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, any> | null;
  after_data: Record<string, any> | null;
  metadata: Record<string, any> | null;
  occurred_at: string; // ISO timestamp from caller
}
