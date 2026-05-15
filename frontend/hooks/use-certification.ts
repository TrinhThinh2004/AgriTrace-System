"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  certificationApi,
  type ApproveChecklistBody,
  type CreateTemplateBody,
  type ListTemplatesParams,
  type RejectChecklistBody,
  type UpdateTemplateBody,
  type UpsertAnswerBody,
} from "@/lib/api/certification";

// ── Templates ──

export function useCertTemplates(params: ListTemplatesParams = {}) {
  return useQuery({
    queryKey: ["cert-templates", params],
    queryFn: () => certificationApi.listTemplates(params),
  });
}

export function useCertTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["cert-templates", id],
    queryFn: () => certificationApi.getTemplate(id!),
    enabled: !!id,
  });
}

export function useCreateCertTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTemplateBody) =>
      certificationApi.createTemplate(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cert-templates"] }),
  });
}

export function useUpdateCertTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTemplateBody }) =>
      certificationApi.updateTemplate(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cert-templates"] }),
  });
}

// ── Checklist Responses ──

export function useLatestChecklist(farmId: string | undefined) {
  return useQuery({
    queryKey: ["checklist-responses", "latest", farmId],
    queryFn: () => certificationApi.getLatestByFarm(farmId!),
    enabled: !!farmId,
  });
}

export function useChecklistResponse(id: string | undefined) {
  return useQuery({
    queryKey: ["checklist-responses", id],
    queryFn: () => certificationApi.getResponseById(id!),
    enabled: !!id,
  });
}

export function useStartChecklist(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      certificationApi.startResponse(farmId, templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklist-responses"] });
      qc.invalidateQueries({ queryKey: ["farms"] });
    },
  });
}

export function useUpsertAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      responseId,
      itemId,
      body,
    }: {
      responseId: string;
      itemId: string;
      body: UpsertAnswerBody;
    }) => certificationApi.upsertAnswer(responseId, itemId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["checklist-responses", vars.responseId],
      });
      qc.invalidateQueries({ queryKey: ["checklist-responses", "latest"] });
    },
  });
}

export function useSubmitChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (responseId: string) => certificationApi.submit(responseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklist-responses"] });
      qc.invalidateQueries({ queryKey: ["farms"] });
    },
  });
}

export function useApproveChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      responseId,
      body,
    }: {
      responseId: string;
      body?: ApproveChecklistBody;
    }) => certificationApi.approve(responseId, body ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklist-responses"] });
      qc.invalidateQueries({ queryKey: ["farms"] });
    },
  });
}

export function useRejectChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      responseId,
      body,
    }: {
      responseId: string;
      body: RejectChecklistBody;
    }) => certificationApi.reject(responseId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklist-responses"] });
      qc.invalidateQueries({ queryKey: ["farms"] });
    },
  });
}
