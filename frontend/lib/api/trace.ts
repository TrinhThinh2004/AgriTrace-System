import { apiFetch } from "./client";
import type { Pagination } from "./product";

// ── Activity Log ──

export interface InputUsed {
  name: string;
  quantity: string;
  unit: string;
}

export interface ActivityLog {
  id: string;
  batch_id: string;
  activity_type: string;
  performed_by: string;
  performed_at: string;
  location: string;
  notes: string;
  inputs_used: InputUsed[];
  is_signed: boolean;
  signed_at: string;
  created_at: string;
}

export interface ActivityLogListResponse {
  logs: ActivityLog[];
}

export interface ActivityLogPageResponse {
  items: ActivityLog[];
  pagination: Pagination;
}

export interface CreateActivityLogBody {
  activity_type: string;
  performed_at: string;
  location?: string;
  notes?: string;
  inputs_used?: InputUsed[];
}

export interface UpdateActivityLogBody {
  activity_type?: string;
  performed_at?: string;
  location?: string;
  notes?: string;
  inputs_used?: InputUsed[];
}

export interface SignBody {
  digital_signature: string;
  signed_at: string;
}

// ── Inspection ──

export interface Inspection {
  id: string;
  batch_id: string;
  inspector_id: string;
  inspection_type: string;
  result: string;
  scheduled_at: string;
  conducted_at: string;
  notes: string;
  report_url: string;
  is_signed: boolean;
  signed_at: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionListResponse {
  inspections: Inspection[];
}

export interface InspectionPageResponse {
  items: Inspection[];
  pagination: Pagination;
}

export interface CreateInspectionBody {
  inspection_type: string;
  result?: string;
  scheduled_at?: string;
  conducted_at?: string;
  notes?: string;
  report_url?: string;
}

export interface UpdateInspectionBody {
  inspection_type?: string;
  result?: string;
  scheduled_at?: string;
  conducted_at?: string;
  notes?: string;
  report_url?: string;
}

// ── Public Trace ──

export interface PublicTraceResponse {
  batch: {
    id: string;
    batch_code: string;
    name: string;
    status: string;
    planting_date: string;
    expected_harvest_date: string;
    actual_harvest_date: string;
    harvested_quantity: string;
    shipped_quantity: string;
    unit: string;
    notes: string;
    created_at: string;
  };
  farm: {
    name: string;
    address: string;
    area_hectares: string;
    certification_status: string;
  } | null;
  crop: {
    name: string;
    description: string;
  } | null;
  activity_logs: Array<{
    id: string;
    activity_type: string;
    performed_by: string;
    performed_at: string;
    location: string;
    notes: string;
    inputs_used: InputUsed[];
    is_signed: boolean;
    signed_at: string;
  }>;
  inspections: Array<{
    id: string;
    inspector_id: string;
    inspection_type: string;
    result: string;
    scheduled_at: string;
    conducted_at: string;
    notes: string;
    report_url: string;
    is_signed: boolean;
    signed_at: string;
  }>;
}

// ── Query params ──

export interface ActivityLogListParams {
  batch_id?: string;
  activity_type?: string;
  performed_by?: string;
  page?: number;
  limit?: number;
}

export interface InspectionListParams {
  batch_id?: string;
  inspector_id?: string;
  inspection_type?: string;
  result?: string;
  page?: number;
  limit?: number;
}

// ── Helper ──

function qs(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ── API objects ──

export const activityLogApi = {
  listByBatch: (batchId: string) =>
    apiFetch<ActivityLogListResponse>(`/batches/${batchId}/activity-logs`),

  list: (params: ActivityLogListParams = {}) =>
    apiFetch<ActivityLogPageResponse>(`/activity-logs${qs(params as Record<string, unknown>)}`),

  getById: (id: string) =>
    apiFetch<ActivityLog>(`/activity-logs/${id}`),

  create: (batchId: string, body: CreateActivityLogBody) =>
    apiFetch<ActivityLog>(`/batches/${batchId}/activity-logs`, {
      method: "POST",
      body,
    }),

  update: (id: string, body: UpdateActivityLogBody) =>
    apiFetch<ActivityLog>(`/activity-logs/${id}`, {
      method: "PATCH",
      body,
    }),

  delete: (id: string) =>
    apiFetch<void>(`/activity-logs/${id}`, { method: "DELETE" }),

  sign: (id: string, body: SignBody) =>
    apiFetch<ActivityLog>(`/activity-logs/${id}/sign`, {
      method: "POST",
      body,
    }),
};

export const inspectionApi = {
  listByBatch: (batchId: string) =>
    apiFetch<InspectionListResponse>(`/batches/${batchId}/inspections`),

  list: (params: InspectionListParams = {}) =>
    apiFetch<InspectionPageResponse>(`/inspections${qs(params as Record<string, unknown>)}`),

  getById: (id: string) =>
    apiFetch<Inspection>(`/inspections/${id}`),

  create: (batchId: string, body: CreateInspectionBody) =>
    apiFetch<Inspection>(`/batches/${batchId}/inspections`, {
      method: "POST",
      body,
    }),

  update: (id: string, body: UpdateInspectionBody) =>
    apiFetch<Inspection>(`/inspections/${id}`, {
      method: "PATCH",
      body,
    }),

  delete: (id: string) =>
    apiFetch<void>(`/inspections/${id}`, { method: "DELETE" }),

  sign: (id: string, body: SignBody) =>
    apiFetch<Inspection>(`/inspections/${id}/sign`, {
      method: "POST",
      body,
    }),
};

export const publicTraceApi = {
  getByBatchCode: (code: string) =>
    apiFetch<PublicTraceResponse>(`/public/trace/${code}`, {
      skipAuthRefresh: true,
    }),
};
