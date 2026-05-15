"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  AlertTriangle,
  ImagePlus,
} from "lucide-react";
import { useFarm } from "@/hooks/use-farms";
import {
  useCertTemplates,
  useLatestChecklist,
  useStartChecklist,
  useSubmitChecklist,
  useUpsertAnswer,
} from "@/hooks/use-certification";
import { ImageUploader } from "@/components/media/ImageUploader";
import { mediaApi } from "@/lib/api/media";
import type {
  ChecklistItem,
  ChecklistResponseDto,
} from "@/lib/api/certification";
import type { Farm } from "@/lib/api/product";

const certTypeLabel: Record<string, string> = {
  VIETGAP: "VietGAP",
  GLOBALGAP: "GlobalGAP",
  ORGANIC: "Hữu cơ",
};

const statusBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Đang soạn", variant: "outline" },
  SUBMITTED: { label: "Chờ duyệt", variant: "secondary" },
  APPROVED: { label: "Đã duyệt", variant: "default" },
  REJECTED: { label: "Từ chối", variant: "destructive" },
};

function useAssetById(id: string) {
  return useQuery({
    queryKey: ["assets", "by-id", id],
    queryFn: () => mediaApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

export function CertificationFlowClient({ farmId }: { farmId: string }) {
  const router = useRouter();
  const { data: farm } = useFarm(farmId);
  const { data: latest, isLoading: loadingLatest } = useLatestChecklist(farmId);
  const { data: templatesData } = useCertTemplates({ active_only: true, limit: 50 });

  const editable = latest && latest.status === "DRAFT";
  const isCompleted =
    latest && (latest.status === "SUBMITTED" || latest.status === "APPROVED");

  const start = useStartChecklist(farmId);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    const items = templatesData?.items ?? [];
    if (items.length && !selectedTemplateId) {
      setSelectedTemplateId(items[0].id);
    }
  }, [templatesData, selectedTemplateId]);

  const handleStart = async () => {
    if (!selectedTemplateId) {
      toast.error("Vui lòng chọn template");
      return;
    }
    try {
      await start.mutateAsync(selectedTemplateId);
      toast.success("Đã bắt đầu checklist — vui lòng điền đầy đủ và gửi duyệt");
    } catch (e: any) {
      toast.error("Không bắt đầu được", { description: e.message });
    }
  };

  if (!farm) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2"
          onClick={() => router.push(`/farms`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại danh sách
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Chứng nhận: {farm.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Điền đầy đủ checklist tiêu chuẩn để xin cấp chứng nhận. Admin sẽ duyệt
            dựa trên câu trả lời và bằng chứng bạn cung cấp.
          </p>
        </div>
      </div>

      <FarmStatusCard farm={farm} />

      {loadingLatest ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !latest || latest.status === "REJECTED" ? (
        <StartResponseCard
          rejectedLatest={latest?.status === "REJECTED" ? latest : null}
          templates={templatesData?.items ?? []}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          starting={start.isPending}
          onStart={handleStart}
        />
      ) : (
        <ChecklistResponseSection
          response={latest}
          readOnly={!editable}
          isCompleted={!!isCompleted}
        />
      )}
    </div>
  );
}

function FarmStatusCard({ farm }: { farm: Farm }) {
  const status = farm.certification_status;
  const isCertified = ["VIETGAP", "GLOBALGAP", "ORGANIC"].includes(status);
  const isPending = status === "PENDING";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-4 w-4" />
          Trạng thái chứng nhận hiện tại
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {isCertified && (
          <div className="flex items-center gap-2">
            <Badge>{certTypeLabel[status]}</Badge>
            {farm.certified_at && (
              <span className="text-muted-foreground">
                Cấp ngày{" "}
                {new Date(farm.certified_at).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>
        )}
        {isPending && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Đang chờ admin duyệt
            </Badge>
            {farm.requested_certification_type && (
              <span className="text-muted-foreground">
                Loại xin: {certTypeLabel[farm.requested_certification_type]}
              </span>
            )}
          </div>
        )}
        {!isCertified && !isPending && (
          <Badge variant="outline">Chưa có chứng nhận</Badge>
        )}
        {farm.reject_reason && status === "NONE" && (
          <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm mt-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">
                Yêu cầu trước bị từ chối
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {farm.reject_reason}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StartResponseCard(props: {
  rejectedLatest: ChecklistResponseDto | null;
  templates: { id: string; name: string; cert_type: string }[];
  selectedTemplateId: string;
  setSelectedTemplateId: (v: string) => void;
  starting: boolean;
  onStart: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {props.rejectedLatest
            ? "Yêu cầu lại chứng nhận"
            : "Bắt đầu xin chứng nhận"}
        </CardTitle>
        <CardDescription>
          Chọn loại chứng nhận muốn xin. Bạn sẽ điền 1 checklist tiêu chuẩn gồm
          nhiều tiêu chí (đất, nước, phân bón, thu hoạch, ghi chép). Mỗi tiêu chí
          cần mô tả + một số có yêu cầu ảnh chứng minh.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {props.rejectedLatest?.notes && (
          <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">
                Lần gửi trước bị từ chối
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {props.rejectedLatest.notes}
              </p>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Loại chứng nhận / Template</Label>
          <Select
            value={props.selectedTemplateId}
            onValueChange={props.setSelectedTemplateId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn template" />
            </SelectTrigger>
            <SelectContent>
              {props.templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({certTypeLabel[t.cert_type] ?? t.cert_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {props.templates.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Chưa có template nào — admin cần seed VIETGAP_VEGETABLE_V1.
            </p>
          )}
        </div>
        <div>
          <Button
            onClick={props.onStart}
            disabled={props.starting || !props.selectedTemplateId}
          >
            {props.starting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Bắt đầu điền checklist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChecklistResponseSection({
  response,
  readOnly,
  isCompleted,
}: {
  response: ChecklistResponseDto;
  readOnly: boolean;
  isCompleted: boolean;
}) {
  const submit = useSubmitChecklist();
  const responseItems = response.items ?? [];
  const answersMap = useMemo(
    () => new Map(responseItems.map((it) => [it.item_id, it])),
    [responseItems],
  );

  const items = response.template?.items ?? [];

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const it of items) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  const requiredItems = items.filter((it) => it.required);
  const filledRequired = requiredItems.filter((it) => {
    const a = answersMap.get(it.id);
    if (!a?.answer?.trim()) return false;
    if (it.evidence_required && !(a.evidence_asset_ids?.length)) return false;
    return true;
  }).length;
  const progress = requiredItems.length
    ? Math.round((filledRequired / requiredItems.length) * 100)
    : 0;

  const handleSubmit = async () => {
    try {
      await submit.mutateAsync(response.id);
      toast.success("Đã gửi checklist — chờ admin duyệt");
    } catch (e: any) {
      toast.error("Không gửi được", { description: e.message });
    }
  };

  const badge = statusBadge[response.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {response.template?.name ?? "Checklist"}
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </CardTitle>
            <CardDescription>
              Tiến độ: {filledRequired}/{requiredItems.length} mục bắt buộc đã đủ
              ({progress}%)
            </CardDescription>
          </div>
          {!readOnly && (
            <Button
              onClick={handleSubmit}
              disabled={
                submit.isPending || filledRequired < requiredItems.length
              }
            >
              {submit.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Gửi duyệt
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isCompleted && response.status === "SUBMITTED" && (
          <div className="mb-4 flex gap-2 rounded-md bg-secondary/40 p-3 text-sm">
            <Clock className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Đã gửi lúc{" "}
              {response.submitted_at
                ? new Date(response.submitted_at).toLocaleString("vi-VN")
                : "—"}{" "}
              — đang chờ admin duyệt.
            </span>
          </div>
        )}
        {response.status === "APPROVED" && (
          <div className="mb-4 flex gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
            <span>
              Đã được duyệt lúc{" "}
              {response.reviewed_at
                ? new Date(response.reviewed_at).toLocaleString("vi-VN")
                : "—"}
              .
            </span>
          </div>
        )}

        <Accordion
          type="multiple"
          defaultValue={grouped.map(([cat]) => cat)}
          className="space-y-2"
        >
          {grouped.map(([category, catItems]) => (
            <AccordionItem
              key={category}
              value={category}
              className="border rounded-md"
            >
              <AccordionTrigger className="px-3 hover:no-underline">
                <span className="text-sm font-semibold">
                  {category}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({catItems.length} tiêu chí)
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-3 pb-3">
                {catItems.map((it) => (
                  <ChecklistItemRow
                    key={it.id}
                    item={it}
                    answer={answersMap.get(it.id) ?? null}
                    responseId={response.id}
                    readOnly={readOnly}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ChecklistItemRow(props: {
  item: ChecklistItem;
  answer: { id: string; answer: string; evidence_asset_ids: string[] } | null;
  responseId: string;
  readOnly: boolean;
}) {
  const [answer, setAnswer] = useState(props.answer?.answer ?? "");
  const [evidenceIds, setEvidenceIds] = useState<string[]>(
    props.answer?.evidence_asset_ids ?? [],
  );
  const upsert = useUpsertAnswer();
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    setAnswer(props.answer?.answer ?? "");
    setEvidenceIds(props.answer?.evidence_asset_ids ?? []);
  }, [props.answer]);

  const persist = async (nextAnswer: string, nextEvidence: string[]) => {
    try {
      await upsert.mutateAsync({
        responseId: props.responseId,
        itemId: props.item.id,
        body: { answer: nextAnswer, evidence_asset_ids: nextEvidence },
      });
    } catch (e: any) {
      toast.error("Lưu thất bại", { description: e.message });
    }
  };

  const handleBlur = () => {
    if (props.readOnly) return;
    if ((props.answer?.answer ?? "") === answer) return;
    void persist(answer, evidenceIds);
  };

  const hasAllRequired =
    !!answer.trim() &&
    (!props.item.evidence_required || evidenceIds.length > 0);

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium flex items-center gap-2">
            {props.item.title}
            {props.item.required && (
              <span className="text-destructive text-xs">*</span>
            )}
            {hasAllRequired ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : null}
          </p>
          {props.item.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {props.item.description}
            </p>
          )}
        </div>
      </div>

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onBlur={handleBlur}
        disabled={props.readOnly}
        placeholder="Mô tả thực trạng / cam kết của bạn..."
        rows={2}
      />

      {props.item.evidence_required && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">
              Bằng chứng (ảnh)
              <span className="text-destructive ml-1">*</span>
            </Label>
            {!props.readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUploader((v) => !v)}
              >
                <ImagePlus className="h-3 w-3 mr-1" />
                {showUploader ? "Ẩn" : "Thêm ảnh"}
              </Button>
            )}
          </div>
          {evidenceIds.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {evidenceIds.map((aid) => (
                <EvidenceThumb
                  key={aid}
                  assetId={aid}
                  onRemove={
                    props.readOnly
                      ? undefined
                      : () => {
                          const next = evidenceIds.filter((x) => x !== aid);
                          setEvidenceIds(next);
                          void persist(answer, next);
                        }
                  }
                />
              ))}
            </div>
          )}
          {!props.readOnly && showUploader && (
            <ImageUploader
              refType="CERTIFICATION_EVIDENCE"
              refId={props.responseId}
              maxFiles={3}
              onUploaded={(asset) => {
                const next = [...evidenceIds, asset.id];
                setEvidenceIds(next);
                void persist(answer, next);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function EvidenceThumb({
  assetId,
  onRemove,
}: {
  assetId: string;
  onRemove?: () => void;
}) {
  const { data } = useAssetById(assetId);
  if (!data) {
    return <div className="aspect-square rounded-md bg-muted animate-pulse" />;
  }
  return (
    <div className="relative rounded-md overflow-hidden border bg-muted aspect-square">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.secure_url} alt="" className="w-full h-full object-cover" />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          aria-label="Xoá"
        >
          ×
        </button>
      )}
    </div>
  );
}
