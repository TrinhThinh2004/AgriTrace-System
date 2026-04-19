"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  KeyRound, Search, Trash2, Loader2, ShieldCheck, ShieldOff, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminKeys, useAdminRevokeKey } from "@/hooks/use-admin-keys";

const roleColors: Record<string, string> = {
  ADMIN: "bg-destructive/10 text-destructive border-destructive/20",
  FARMER: "bg-success/10 text-success border-success/20",
  INSPECTOR: "bg-info/10 text-info border-info/20",
};

function formatDate(d: string | undefined | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminKeysPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [revokeTarget, setRevokeTarget] = useState<{
    key_id: string;
    user_full_name: string;
  } | null>(null);

  const { data, isLoading } = useAdminKeys({
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const adminRevoke = useAdminRevokeKey();

  const items = data?.items ?? [];
  const filtered = items.filter((k) => {
    const q = search.toLowerCase();
    return (
      k.user_full_name.toLowerCase().includes(q) ||
      k.user_email.toLowerCase().includes(q) ||
      k.key_id.toLowerCase().includes(q)
    );
  });

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await adminRevoke.mutateAsync(revokeTarget.key_id);
      toast.success("Đã thu hồi khóa thành công");
      setRevokeTarget(null);
    } catch (e: any) {
      toast.error("Lỗi thu hồi", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý khóa số</h1>
        <p className="text-sm text-muted-foreground">
          Xem và quản lý tất cả khóa số trong hệ thống
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email, key ID..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[40]]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <KeyRound className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Không tìm thấy khóa số nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key ID</TableHead>
                  <TableHead>Chủ sở hữu</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Thuật toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((key) => (
                  <TableRow key={key.key_id}>
                    <TableCell className="font-mono text-xs">
                      {key.key_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {key.user_full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                          {key.user_full_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.user_email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${roleColors[key.user_role] || ""}`}
                      >
                        {key.user_role.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{key.algorithm}</Badge>
                    </TableCell>
                    <TableCell>
                      {key.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <ShieldOff className="h-3 w-3 mr-1" /> Revoked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(key.created_at)}
                    </TableCell>
                    <TableCell>
                      {key.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            setRevokeTarget({
                              key_id: key.key_id,
                              user_full_name: key.user_full_name,
                            })
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirm Dialog */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Thu hồi khóa khẩn cấp?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang thu hồi khóa của{" "}
              <strong>{revokeTarget?.user_full_name}</strong>. Sau khi thu hồi,
              người dùng này không thể ký số cho đến khi tạo khóa mới. Các chữ
              ký đã tạo trước đó vẫn hợp lệ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {adminRevoke.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Thu hồi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
