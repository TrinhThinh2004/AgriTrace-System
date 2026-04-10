"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cropCategoryApi,
  type ListParams,
  type CreateCropCategoryBody,
  type UpdateCropCategoryBody,
} from "@/lib/api/product";

export function useCropCategories(params: ListParams = {}) {
  return useQuery({
    queryKey: ["crop-categories", params],
    queryFn: () => cropCategoryApi.list(params),
  });
}

export function useCreateCropCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCropCategoryBody) => cropCategoryApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-categories"] }),
  });
}

export function useUpdateCropCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCropCategoryBody }) =>
      cropCategoryApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-categories"] }),
  });
}

export function useDeleteCropCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cropCategoryApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-categories"] }),
  });
}
