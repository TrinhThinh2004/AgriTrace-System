"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  mediaApi,
  type AssetRefType,
  type ListAssetsParams,
  type UploadAssetParams,
} from "@/lib/api/media";

export function useAssets(
  params: ListAssetsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["assets", params],
    queryFn: () => mediaApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useAssetsByRef(
  ref_type: AssetRefType | undefined,
  ref_id: string | undefined,
) {
  return useQuery({
    queryKey: ["assets", { ref_type, ref_id }],
    queryFn: () => mediaApi.list({ ref_type, ref_id, limit: 100 }),
    enabled: !!ref_type && !!ref_id,
  });
}

export function useUploadAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: UploadAssetParams) => mediaApi.upload(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}
