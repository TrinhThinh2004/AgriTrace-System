"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Award, Clock, AlertTriangle, ClipboardCheck } from "lucide-react";
import type { Farm } from "@/lib/api/product";

const certTypeLabel: Record<string, string> = {
  VIETGAP: "VietGAP",
  GLOBALGAP: "GlobalGAP",
  ORGANIC: "Hữu cơ",
};

interface Props {
  farm: Farm;
}

export function FarmCertificationPanel({ farm }: Props) {
  const status = farm.certification_status;
  const isCertified = ["VIETGAP", "GLOBALGAP", "ORGANIC"].includes(status);
  const isPending = status === "PENDING";
  const hasPriorReject = !!farm.reject_reason && status === "NONE";

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Chứng nhận</Label>
        {isCertified && (
          <Badge className="text-xs">
            <Award className="h-3 w-3 mr-1" />
            {certTypeLabel[status]}
          </Badge>
        )}
        {isPending && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Đang chờ duyệt
          </Badge>
        )}
        {!isCertified && !isPending && (
          <Badge variant="outline" className="text-xs">
            Chưa có
          </Badge>
        )}
      </div>

      {isCertified && farm.certified_at && (
        <p className="text-xs text-muted-foreground">
          Được cấp ngày{" "}
          {new Date(farm.certified_at).toLocaleDateString("vi-VN")}
        </p>
      )}

      {isPending && (
        <p className="text-sm text-muted-foreground">
          Đang chờ duyệt:{" "}
          <strong>
            {certTypeLabel[farm.requested_certification_type ?? ""] ??
              farm.requested_certification_type}
          </strong>
        </p>
      )}

      {hasPriorReject && (
        <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm">
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

      {(!isCertified || isPending) && (
        <div className="pt-2">
          <Link href={`/farms/${farm.id}/certification`}>
            <Button size="sm" className="w-full">
              <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
              {isPending
                ? "Xem checklist đã gửi"
                : hasPriorReject
                  ? "Yêu cầu lại với checklist"
                  : "Bắt đầu xin chứng nhận"}
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            Điền checklist tiêu chuẩn (đất, nước, BVTV, ghi chép) kèm ảnh chứng minh
            — admin sẽ duyệt dựa trên checklist của bạn.
          </p>
        </div>
      )}

      {isCertified && (
        <div className="pt-2">
          <Link href={`/farms/${farm.id}/certification`}>
            <Button size="sm" variant="outline" className="w-full">
              Xem checklist đã duyệt
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
