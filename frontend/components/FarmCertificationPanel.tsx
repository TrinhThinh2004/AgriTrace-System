"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRequestCertification } from "@/hooks/use-farms";
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
  const [requestedType, setRequestedType] = useState<string>("VIETGAP");
  const requestCert = useRequestCertification();

  const status = farm.certification_status;
  const isCertified = ["VIETGAP", "GLOBALGAP", "ORGANIC"].includes(status);
  const isPending = status === "PENDING";
  const hasPriorReject = !!farm.reject_reason && status === "NONE";

  const handleRequest = async () => {
    try {
      await requestCert.mutateAsync({ id: farm.id, requested_type: requestedType });
      toast.success("Đã gửi yêu cầu chứng nhận", {
        description: "Quản trị viên sẽ xem xét và phản hồi sớm.",
      });
    } catch (e: any) {
      toast.error("Lỗi gửi yêu cầu", { description: e.message });
    }
  };

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

      {!isCertified && !isPending && (
        <div className="space-y-2 pt-2">
          <Label className="text-xs">Loại chứng nhận muốn xin</Label>
          <div className="flex gap-2">
            <Select value={requestedType} onValueChange={setRequestedType}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIETGAP">VietGAP</SelectItem>
                <SelectItem value="GLOBALGAP">GlobalGAP</SelectItem>
                <SelectItem value="ORGANIC">Hữu cơ</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRequest} disabled={requestCert.isPending}>
              {requestCert.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              {hasPriorReject ? "Yêu cầu lại" : "Gửi yêu cầu"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
