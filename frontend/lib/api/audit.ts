import { apiFetch } from "./client";

// ── Types ──

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface AuditLog {
  id: string;
  seq_no: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_data: string; // JSON string từ BE; FE tự parse khi hiển thị
  after_data: string;
  metadata: string;
  prev_hash: string;
  record_hash: string;
  anchor_id: string;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  pagination: Pagination;
}

export interface Anchor {
  id: string;
  merkle_root: string;
  from_seq: string;
  to_seq: string;
  tx_hash: string;
  block_number: string;
  chain_id: number;
  onchain_anchor_id: string;
  anchored_at: string;
}

export interface AnchorListResponse {
  items: Anchor[];
  pagination: Pagination;
}

export interface VerifyLogResponse {
  log: AuditLog;
  recomputed_hash: string;
  hash_chain_valid: boolean;
  prev_record_hash: string;
  anchor: Anchor;
  anchor_present: boolean;
  merkle_proof_valid: boolean;
  onchain_merkle_root: string;
  onchain_root_match: boolean;
  merkle_proof: string[];
}

export interface TriggerAnchorResponse {
  skipped: boolean;
  reason: string;
  count: number;
  from_seq: string;
  to_seq: string;
  anchor_id: string;
  tx_hash: string;
  block_number: string;
  merkle_root: string;
}

export interface ListAuditParams {
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ListAnchorsParams {
  page?: number;
  limit?: number;
}

// ── Helpers ──

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  );
}

// ── API ──

export const auditApi = {
  list: (params: ListAuditParams = {}) =>
    apiFetch<AuditLogListResponse>(`/audit${qs(params as Record<string, unknown>)}`),

  getBySeq: (seqNo: string) =>
    apiFetch<AuditLog>(`/audit/${encodeURIComponent(seqNo)}`),

  verify: (seqNo: string) =>
    apiFetch<VerifyLogResponse>(`/audit/${encodeURIComponent(seqNo)}/verify`),

  listAnchors: (params: ListAnchorsParams = {}) =>
    apiFetch<AnchorListResponse>(`/audit/anchors${qs(params as Record<string, unknown>)}`),

  getAnchor: (id: string) =>
    apiFetch<Anchor>(`/audit/anchors/${encodeURIComponent(id)}`),

  /** Dev/demo only — chạy anchor cron thủ công (admin only). */
  triggerAnchor: () =>
    apiFetch<TriggerAnchorResponse>(`/audit/_dev/anchor-now`, {
      method: "POST",
    }),
};
