"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  farmApi,
  type ListParams,
  type CreateFarmBody,
  type UpdateFarmBody,
} from "@/lib/api/product";

export function useFarms(params: ListParams = {}) {
  return useQuery({
    queryKey: ["farms", params],
    queryFn: () => farmApi.list(params),
  });
}

export function useFarm(id: string | undefined) {
  return useQuery({
    queryKey: ["farms", id],
    queryFn: () => farmApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFarmBody) => farmApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
}

export function useUpdateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFarmBody }) =>
      farmApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
}

export function useDeleteFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => farmApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
}

export function useRequestCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requested_type }: { id: string; requested_type: string }) =>
      farmApi.requestCertification(id, { requested_type }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
}

export function useApproveCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, granted_type }: { id: string; granted_type?: string }) =>
      farmApi.approveCertification(id, granted_type ? { granted_type } : undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
}

export function useRejectCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      farmApi.rejectCertification(id, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
}
