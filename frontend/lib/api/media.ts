import { apiFetch } from "./client";
import type { Pagination } from "./product";

export type AssetRefType =
  | "USER_AVATAR"
  | "FARM_PHOTO"
  | "BATCH_PHOTO"
  | "CROP_PHOTO";

export interface Asset {
  id: string;
  owner_id: string;
  ref_type: AssetRefType;
  ref_id: string | null;
  cloudinary_public_id: string;
  url: string;
  secure_url: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  original_filename: string | null;
  created_at: string;
}

export interface AssetListResponse {
  items: Asset[];
  pagination: Pagination;
}

export interface ListAssetsParams {
  ref_type?: AssetRefType;
  ref_id?: string;
  owner_id?: string;
  page?: number;
  limit?: number;
}

export interface UploadAssetParams {
  file: File;
  ref_type: AssetRefType;
  ref_id?: string;
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  );
}

export const mediaApi = {
  upload: ({ file, ref_type, ref_id }: UploadAssetParams) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<Asset>(
      `/media/upload${qs({ ref_type, ref_id })}`,
      { method: "POST", body: form },
    );
  },

  getById: (id: string) => apiFetch<Asset>(`/media/${id}`),

  list: (params: ListAssetsParams = {}) =>
    apiFetch<AssetListResponse>(
      `/media${qs(params as Record<string, unknown>)}`,
    ),

  delete: (id: string) =>
    apiFetch<void>(`/media/${id}`, { method: "DELETE" }),
};
