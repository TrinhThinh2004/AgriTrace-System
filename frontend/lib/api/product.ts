import { apiFetch } from "./client";

// ── Types ──

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

// Farm
export interface Farm {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  location_lat: string;
  location_long: string;
  area_hectares: string;
  certification_status: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FarmListResponse {
  items: Farm[];
  pagination: Pagination;
}

export interface CreateFarmBody {
  name: string;
  address?: string;
  location_lat?: string;
  location_long?: string;
  area_hectares?: string;
  certification_status?: string;
  owner_id?: string;
}

export interface UpdateFarmBody {
  name?: string;
  address?: string;
  location_lat?: string;
  location_long?: string;
  area_hectares?: string;
  certification_status?: string;
  status?: string;
}

// Batch
export type BatchStatus =
  | "SEEDING"
  | "GROWING"
  | "HARVESTED"
  | "INSPECTED"
  | "PACKED"
  | "SHIPPED";

export interface Batch {
  id: string;
  batch_code: string;
  farm_id: string;
  crop_category_id: string;
  name: string;
  status: BatchStatus;
  planting_date: string;
  expected_harvest_date: string;
  actual_harvest_date: string;
  harvested_quantity: string;
  shipped_quantity: string;
  unit: string;
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  farm?: Farm;
  crop_category?: CropCategory;
}

export interface BatchListResponse {
  items: Batch[];
  pagination: Pagination;
}

export interface CreateBatchBody {
  batch_code: string;
  farm_id: string;
  crop_category_id: string;
  name: string;
  planting_date?: string;
  expected_harvest_date?: string;
  unit?: string;
  notes?: string;
}

export interface UpdateBatchBody {
  name?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  harvested_quantity?: string;
  shipped_quantity?: string;
  unit?: string;
  notes?: string;
}

export interface TransitionBatchBody {
  next_status: BatchStatus;
  actual_harvest_date?: string;
  harvested_quantity?: string;
  shipped_quantity?: string;
}

// Crop Category
export interface CropCategory {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CropCategoryListResponse {
  items: CropCategory[];
  pagination: Pagination;
}

export interface CreateCropCategoryBody {
  name: string;
  description?: string;
}

export interface UpdateCropCategoryBody {
  name?: string;
  description?: string;
  status?: string;
}

// ── Query params ──

export interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface BatchListParams extends ListParams {
  farm_id?: string;
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

export const farmApi = {
  list: (params: ListParams = {}) =>
    apiFetch<FarmListResponse>(`/farms${qs(params)}`),

  getById: (id: string) => apiFetch<Farm>(`/farms/${id}`),

  create: (body: CreateFarmBody) =>
    apiFetch<Farm>("/farms", { method: "POST", body }),

  update: (id: string, body: UpdateFarmBody) =>
    apiFetch<Farm>(`/farms/${id}`, { method: "PATCH", body }),

  delete: (id: string) =>
    apiFetch<void>(`/farms/${id}`, { method: "DELETE" }),
};

export const batchApi = {
  list: (params: BatchListParams = {}) =>
    apiFetch<BatchListResponse>(`/batches${qs(params)}`),

  getById: (id: string) => apiFetch<Batch>(`/batches/${id}`),

  create: (body: CreateBatchBody) =>
    apiFetch<Batch>("/batches", { method: "POST", body }),

  update: (id: string, body: UpdateBatchBody) =>
    apiFetch<Batch>(`/batches/${id}`, { method: "PATCH", body }),

  transition: (id: string, body: TransitionBatchBody) =>
    apiFetch<Batch>(`/batches/${id}/transition`, { method: "POST", body }),

  delete: (id: string) =>
    apiFetch<void>(`/batches/${id}`, { method: "DELETE" }),
};

export const cropCategoryApi = {
  list: (params: ListParams = {}) =>
    apiFetch<CropCategoryListResponse>(`/crop-categories${qs(params)}`),

  getById: (id: string) => apiFetch<CropCategory>(`/crop-categories/${id}`),

  create: (body: CreateCropCategoryBody) =>
    apiFetch<CropCategory>("/crop-categories", { method: "POST", body }),

  update: (id: string, body: UpdateCropCategoryBody) =>
    apiFetch<CropCategory>(`/crop-categories/${id}`, { method: "PATCH", body }),

  delete: (id: string) =>
    apiFetch<void>(`/crop-categories/${id}`, { method: "DELETE" }),
};
