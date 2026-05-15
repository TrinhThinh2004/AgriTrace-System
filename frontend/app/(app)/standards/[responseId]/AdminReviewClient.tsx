"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ArrowLeft,
  Check,
  X,
  Loader2,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  useApproveChecklist,
  useChecklistResponse,
  useRejectChecklist,
} from "@/hooks/use-certification";
import { useFarm } from "@/hooks/use-farms";
import { useUsers } from "@/hooks/use-users";
import { mediaApi } from "@/lib/api/media";
import type {
  ChecklistItem,
  ChecklistResponseDto,
} from "@/lib/api/certification";

const certTypeLabel: Record<string, string> = {
  VIETGAP: "VietGAP",
  GLOBALGAP: "GlobalGAP",
  ORGANIC: "Hữu cơ",
};

function useAssetById(id: string) {
  return useQuery({
    queryKey: ["assets", "by-id", id],
    queryFn: () => mediaApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

export function AdminReviewClient({ responseId }: { responseId: string }) {
  const router = useRouter();
  const { data: response, isLoading } = useChecklistResponse(responseId);
  const { data: farm } = useFarm(response?.farm_id);
  const { data: usersData } = useUsers({ limit: 200 });
  const userMap = useMemo(
    () => new Map((usersData?.items ?? []).map((u) => [u.id, u.full_name])),
    [usersData],
  );

  const approve = useApproveChecklist();
  const reject = useRejectChecklist();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [grantedType, setGrantedType] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  if (isLoading || !response) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canReview = response.status === "SUBMITTED";
  const defaultGrantedType =
    grantedType || response.template?.cert_type || "VIETGAP";

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({
        responseId,
        body: {
          granted_type: defaultGrantedType as any,
          notes: adminNotes.trim() || undefined,
        },
      });
      toast.success(
        `Đã duyệt: cấp chứng nhận ${certTypeLabel[defaultGrantedType] ?? defaultGrantedType}`,
      );
      setApproveOpen(false);
    } catch (e: any) {
      toast.error("Lỗi duyệt", { description: e.message });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await reject.mutateAsync({
        responseId,
        body: {
          reason: rejectReason.trim(),
          notes: adminNotes.trim() || undefined,
        },
      });
      toast.success("Đã từ chối checklist");
      setRejectOpen(false);
    } catch (e: any) {
      toast.error("Lỗi từ chối", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2"
          onClick={() => router.push("/standards")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại hàng đợi
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Duyệt checklist chứng nhận
            </h1>
            <p className="text-sm text-muted-foreground">
              Xem từng câu trả lời + bằng chứng farmer cung cấp trước khi duyệt.
            </p>
          </div>
          {canReview && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setGrantedType(response.template?.cert_type ?? "VIETGAP");
                  setApproveOpen(true);
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                Duyệt
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <X className="h-4 w-4 mr-1" />
                Từ chối
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {response.template?.name ?? "Checklist"}
          </CardTitle>
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1">
            <span>Trạng thái:</span>
            <Badge
              variant={
                response.status === "APPROVED"
                  ? "default"
                  : response.status === "REJECTED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {response.status}
            </Badge>
            <span>· Loại chứng nhận:</span>
            <strong>
              {certTypeLabel[response.template?.cert_type ?? ""] ??
                response.template?.cert_type}
            </strong>
          </div>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Trang trại</p>
            <p className="font-medium">
              {farm?.name ?? response.farm_id}
            </p>
            {farm?.address && (
              <p className="text-xs text-muted-foreground">{farm.address}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Chủ sở hữu</p>
            <p>{farm ? userMap.get(farm.owner_id) ?? "—" : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gửi lúc</p>
            <p>
              {response.submitted_at
                ? new Date(response.submitted_at).toLocaleString("vi-VN")
                : "—"}
            </p>
          </div>
          {response.reviewed_at && (
            <div>
              <p className="text-xs text-muted-foreground">Đã review</p>
              <p>
                {new Date(response.reviewed_at).toLocaleString("vi-VN")} bởi{" "}
                {response.reviewed_by
                  ? userMap.get(response.reviewed_by) ?? response.reviewed_by
                  : "—"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {response.status === "REJECTED" && response.notes && (
        <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-destructive">Lý do từ chối</p>
            <p className="text-xs text-muted-foreground mt-1">
              {response.notes}
            </p>
          </div>
        </div>
      )}

      {response.status === "APPROVED" && (
        <div className="flex gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-medium">Đã duyệt</p>
            {response.notes && (
              <p className="text-xs text-muted-foreground mt-1">
                {response.notes}
              </p>
            )}
            {farm && (
              <p className="text-xs text-muted-foreground mt-1">
                Trang trại đã được cấp:{" "}
                <strong>
                  {certTypeLabel[farm.certification_status] ??
                    farm.certification_status}
                </strong>
              </p>
            )}
          </div>
        </div>
      )}

      <ChecklistByCategory response={response} />

      {farm && (
        <div className="text-sm text-muted-foreground">
          <Link
            href={`/farms/${farm.id}/certification`}
            className="underline underline-offset-2"
          >
            Mở trang chứng nhận của farmer →
          </Link>
        </div>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duyệt checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Loại chứng nhận sẽ cấp</Label>
              <Select value={defaultGrantedType} onValueChange={setGrantedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIETGAP">VietGAP</SelectItem>
                  <SelectItem value="GLOBALGAP">GlobalGAP</SelectItem>
                  <SelectItem value="ORGANIC">Hữu cơ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="approve-notes" className="text-xs">
                Ghi chú (tùy chọn)
              </Label>
              <Textarea
                id="approve-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Ghi chú thêm cho farmer..."
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={approve.isPending}
            >
              Huỷ
            </Button>
            <Button onClick={handleApprove} disabled={approve.isPending}>
              {approve.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Xác nhận duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reject-reason" className="text-xs">
                Lý do từ chối
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Ví dụ: Thiếu ảnh chứng minh phần BVTV, mô tả phần ghi chép quá ngắn..."
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={reject.isPending}
            >
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reject.isPending || !rejectReason.trim()}
            >
              {reject.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChecklistByCategory({
  response,
}: {
  response: ChecklistResponseDto;
}) {
  const items = response.template?.items ?? [];
  const responseItems = response.items ?? [];
  const answersMap = useMemo(
    () => new Map(responseItems.map((it) => [it.item_id, it])),
    [responseItems],
  );
  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const it of items) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
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
                ({catItems.length})
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 px-3 pb-3">
            {catItems.map((it) => {
              const ans = answersMap.get(it.id);
              const hasAnswer = !!ans?.answer?.trim();
              const hasEvidence = !!ans?.evidence_asset_ids?.length;
              const ok =
                hasAnswer && (!it.evidence_required || hasEvidence);
              return (
                <div key={it.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {it.title}
                        {it.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </p>
                      {it.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {it.description}
                        </p>
                      )}
                    </div>
                    {ok ? (
                      <Badge variant="default" className="h-fit">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Đủ
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-fit">
                        Thiếu
                      </Badge>
                    )}
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 text-sm whitespace-pre-wrap">
                    {ans?.answer || (
                      <span className="text-muted-foreground italic">
                        (Chưa trả lời)
                      </span>
                    )}
                  </div>
                  {it.evidence_required && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Bằng chứng:
                      </p>
                      {ans?.evidence_asset_ids?.length ? (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {ans.evidence_asset_ids.map((aid) => (
                            <EvidenceThumb key={aid} assetId={aid} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">
                          Chưa có ảnh
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function EvidenceThumb({ assetId }: { assetId: string }) {
  const { data } = useAssetById(assetId);
  if (!data) {
    return <div className="aspect-square rounded-md bg-muted animate-pulse" />;
  }
  return (
    <a
      href={data.secure_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-md overflow-hidden border bg-muted aspect-square"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.secure_url} alt="" className="w-full h-full object-cover" />
    </a>
  );
}
