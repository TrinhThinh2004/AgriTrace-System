"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  inspectionApi,
  type CreateInspectionBody,
  type UpdateInspectionBody,
  type SignBody,
} from "@/lib/api/trace";

export function useInspectionsByBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: ["inspections", "batch", batchId],
    queryFn: () => inspectionApi.listByBatch(batchId!),
    enabled: !!batchId,
  });
}

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, body }: { batchId: string; body: CreateInspectionBody }) =>
      inspectionApi.create(batchId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["inspections", "batch", vars.batchId] });
    },
  });
}

export function useUpdateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateInspectionBody }) =>
      inspectionApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
    },
  });
}

export function useDeleteInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inspectionApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
    },
  });
}

export function useSignInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SignBody }) =>
      inspectionApi.sign(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
    },
  });
}
