"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { useBatches } from "@/hooks/use-batches";
import { useFarms } from "@/hooks/use-farms";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateBatchDialog } from "@/components/CreateBatchDialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "SEEDING", label: "Gieo trồng" },
  { value: "GROWING", label: "Đang phát triển" },
  { value: "HARVESTED", label: "Đã thu hoạch" },
  { value: "INSPECTED", label: "Đã kiểm định" },
  { value: "PACKED", label: "Đã đóng gói" },
  { value: "SHIPPED", label: "Đã xuất kho" },
];

export default function BatchesManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  const { data: batchData, isLoading } = useBatches();
  const { data: farmData } = useFarms();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: usersData } = useUsers(isAdmin ? { limit: 100 } : undefined);

  const batches = batchData?.items ?? [];
  const farms = farmData?.items ?? [];

  const farmMap = new Map(farms.map((f) => [f.id, f.name]));
  const farmOwnerMap = new Map(farms.map((f) => [f.id, f.owner_id]));
  const userMap = new Map(
    (usersData?.items ?? []).map((u) => [u.id, u.full_name]),
  );
  const ownerNameFor = (b: { created_by?: string; farm_id: string }) => {
    const ownerId = b.created_by || farmOwnerMap.get(b.farm_id);
    return ownerId ? userMap.get(ownerId) ?? "—" : "—";
  };

  const filtered = batches.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const farmName = farmMap.get(b.farm_id) ?? "";
      if (
        !b.batch_code.toLowerCase().includes(q) &&
        !b.name.toLowerCase().includes(q) &&
        !farmName.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quản lý lô hàng</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách tất cả lô hàng trong hệ thống
          </p>
        </div>
        <CreateBatchDialog />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm mã lô, tên, trang trại..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
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
                  <TableHead>Mã lô</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Trang trại</TableHead>
                  {isAdmin && <TableHead>Nông dân</TableHead>}
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày trồng</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/batch/${b.id}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {b.batch_code}
                    </TableCell>
                    <TableCell>{b.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {farmMap.get(b.farm_id) ?? "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-sm">
                        {ownerNameFor(b)}
                      </TableCell>
                    )}
                    <TableCell>
                      <StatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.planting_date
                        ? new Date(b.planting_date).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.created_at
                        ? new Date(b.created_at).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 7 : 6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Không tìm thấy lô hàng
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
