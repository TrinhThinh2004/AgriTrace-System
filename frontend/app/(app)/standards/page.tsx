"use client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Check, X, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useFarms,
  useApproveCertification,
  useRejectCertification,
} from "@/hooks/use-farms";
import { useUsers } from "@/hooks/use-users";
import type { Farm } from "@/lib/api/product";

const certTypeLabel: Record<string, string> = {
  VIETGAP: "VietGAP",
  GLOBALGAP: "GlobalGAP",
  ORGANIC: "Hữu cơ",
};

export default function StandardsApprovalQueue() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [approvingFarm, setApprovingFarm] = useState<Farm | null>(null);
  const [grantedType, setGrantedType] = useState<string>("VIETGAP");
  const [rejectingFarm, setRejectingFarm] = useState<Farm | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useFarms({
    certification_status: "PENDING",
    limit: 100,
  });
  const { data: usersData } = useUsers({ limit: 100 });
  const approve = useApproveCertification();
  const reject = useRejectCertification();

  const userMap = useMemo(
    () => new Map((usersData?.items ?? []).map((u) => [u.id, u.full_name])),
    [usersData],
  );

  const farms = data?.items ?? [];
  const filtered = farms.filter((f) => {
    if (
      typeFilter !== "ALL" &&
      f.requested_certification_type !== typeFilter
    ) {
      return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.address ?? "").toLowerCase().includes(q)
    );
  });

  const openApprove = (farm: Farm) => {
    setApprovingFarm(farm);
    const requested = farm.requested_certification_type;
    setGrantedType(
      requested && ["VIETGAP", "GLOBALGAP", "ORGANIC"].includes(requested)
        ? requested
        : "VIETGAP",
    );
  };

  const handleApprove = async () => {
    if (!approvingFarm) return;
    try {
      await approve.mutateAsync({ id: approvingFarm.id, granted_type: grantedType });
      toast.success(
        `Đã duyệt chứng nhận ${certTypeLabel[grantedType] ?? grantedType} cho ${approvingFarm.name}`,
      );
      setApprovingFarm(null);
    } catch (e: any) {
      toast.error("Lỗi duyệt", { description: e.message });
    }
  };

  const handleReject = async () => {
    if (!rejectingFarm) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await reject.mutateAsync({
        id: rejectingFarm.id,
        reason: rejectReason.trim(),
      });
      toast.success(`Đã từ chối yêu cầu của ${rejectingFarm.name}`);
      setRejectingFarm(null);
      setRejectReason("");
    } catch (e: any) {
      toast.error("Lỗi từ chối", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Duyệt yêu cầu chứng nhận
          </h1>
          <p className="text-sm text-muted-foreground">
            Hàng đợi yêu cầu cấp chứng nhận VietGAP, GlobalGAP, Hữu cơ
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tên trang trại..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Loại chứng nhận" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại</SelectItem>
            <SelectItem value="VIETGAP">VietGAP</SelectItem>
            <SelectItem value="GLOBALGAP">GlobalGAP</SelectItem>
            <SelectItem value="ORGANIC">Hữu cơ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trang trại</TableHead>
                  <TableHead>Chủ sở hữu</TableHead>
                  <TableHead>Loại xin</TableHead>
                  <TableHead>Ngày yêu cầu</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {f.address || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {userMap.get(f.owner_id) ?? "—"}
                    </TableCell>
                    <TableCell>
                      {f.requested_certification_type ? (
                        <Badge variant="secondary" className="text-xs">
                          {certTypeLabel[f.requested_certification_type] ??
                            f.requested_certification_type}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Chưa chỉ định
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {f.updated_at
                        ? new Date(f.updated_at).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openApprove(f)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectingFarm(f)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Từ chối
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Không có yêu cầu nào đang chờ duyệt
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve confirm dialog */}
      <Dialog
        open={!!approvingFarm}
        onOpenChange={(open) => {
          if (!open) setApprovingFarm(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu chứng nhận</DialogTitle>
            <DialogDescription>
              {approvingFarm && (
                <>
                  Trang trại: <strong>{approvingFarm.name}</strong>
                  {approvingFarm.requested_certification_type ? (
                    <>
                      {" "}— Loại đề nghị:{" "}
                      <strong>
                        {certTypeLabel[
                          approvingFarm.requested_certification_type
                        ] ?? approvingFarm.requested_certification_type}
                      </strong>
                    </>
                  ) : (
                    <> — Yêu cầu chưa chỉ định loại, vui lòng chọn:</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Loại chứng nhận sẽ cấp</Label>
            <Select value={grantedType} onValueChange={setGrantedType}>
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovingFarm(null)}
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

      {/* Reject dialog with reason */}
      <Dialog
        open={!!rejectingFarm}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingFarm(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu chứng nhận</DialogTitle>
            <DialogDescription>
              {rejectingFarm && (
                <>Trang trại: <strong>{rejectingFarm.name}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Lý do từ chối</Label>
            <Textarea
              id="reject-reason"
              placeholder="Ví dụ: Thiếu giấy tờ kiểm định, hồ sơ chưa đầy đủ..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {rejectReason.length}/500
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectingFarm(null);
                setRejectReason("");
              }}
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
