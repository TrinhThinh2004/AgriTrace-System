import { apiFetch } from "./client";
import type { Pagination } from "./product";

// ── Types ──

export type CertType = "VIETGAP" | "GLOBALGAP" | "ORGANIC";

export type ChecklistResponseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export interface ChecklistItem {
  id: string;
  template_id: string;
  order: number;
  category: string;
  code: string;
  title: string;
  description?: string;
  required: boolean;
  evidence_required: boolean;
}

export interface CertificationTemplate {
  id: string;
  code: string;
  name: string;
  cert_type: CertType;
  version: number;
  active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  items: ChecklistItem[];
}

export interface TemplateListResponse {
  items: CertificationTemplate[];
  pagination: Pagination;
}

export interface ChecklistResponseItemDto {
  id: string;
  response_id: string;
  item_id: string;
  answer: string;
  evidence_asset_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistResponseDto {
  id: string;
  farm_id: string;
  template_id: string;
  status: ChecklistResponseStatus;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: ChecklistResponseItemDto[];
  template?: CertificationTemplate;
}

// ── Request bodies ──

export interface CreateTemplateItemBody {
  order?: number;
  category: string;
  code: string;
  title: string;
  description?: string;
  required?: boolean;
  evidence_required?: boolean;
}

export interface CreateTemplateBody {
  code: string;
  name: string;
  cert_type: CertType;
  version?: number;
  active?: boolean;
  description?: string;
  items?: CreateTemplateItemBody[];
}

export interface UpdateTemplateBody {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface ListTemplatesParams {
  cert_type?: CertType;
  active_only?: boolean;
  page?: number;
  limit?: number;
}

export interface UpsertAnswerBody {
  answer: string;
  evidence_asset_ids?: string[];
}

export interface ApproveChecklistBody {
  granted_type?: CertType;
  notes?: string;
}

export interface RejectChecklistBody {
  reason: string;
  notes?: string;
}

// ── Helper ──
function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  );
}

// ── API ──

export const certificationApi = {
  // Templates
  listTemplates: (params: ListTemplatesParams = {}) =>
    apiFetch<TemplateListResponse>(
      `/certification-templates${qs(params as Record<string, unknown>)}`,
    ),

  getTemplate: (id: string) =>
    apiFetch<CertificationTemplate>(`/certification-templates/${id}`),

  createTemplate: (body: CreateTemplateBody) =>
    apiFetch<CertificationTemplate>("/certification-templates", {
      method: "POST",
      body,
    }),

  updateTemplate: (id: string, body: UpdateTemplateBody) =>
    apiFetch<CertificationTemplate>(`/certification-templates/${id}`, {
      method: "PATCH",
      body,
    }),

  // Checklist responses
  startResponse: (farmId: string, templateId: string) =>
    apiFetch<ChecklistResponseDto>(
      `/farms/${farmId}/checklist-responses`,
      { method: "POST", body: { template_id: templateId } },
    ),

  getLatestByFarm: (farmId: string) =>
    apiFetch<ChecklistResponseDto | null>(
      `/farms/${farmId}/checklist-responses/latest`,
    ),

  getResponseById: (id: string) =>
    apiFetch<ChecklistResponseDto>(`/checklist-responses/${id}`),

  upsertAnswer: (responseId: string, itemId: string, body: UpsertAnswerBody) =>
    apiFetch<ChecklistResponseItemDto>(
      `/checklist-responses/${responseId}/items/${itemId}`,
      { method: "PATCH", body },
    ),

  submit: (responseId: string) =>
    apiFetch<ChecklistResponseDto>(
      `/checklist-responses/${responseId}/submit`,
      { method: "POST" },
    ),

  approve: (responseId: string, body: ApproveChecklistBody = {}) =>
    apiFetch<ChecklistResponseDto>(
      `/checklist-responses/${responseId}/approve`,
      { method: "POST", body },
    ),

  reject: (responseId: string, body: RejectChecklistBody) =>
    apiFetch<ChecklistResponseDto>(
      `/checklist-responses/${responseId}/reject`,
      { method: "POST", body },
    ),
};
