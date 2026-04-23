"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { useFarms, useUpdateFarm, useDeleteFarm } from "@/hooks/use-farms";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import type { Farm } from "@/lib/api/product";

import { CreateFarmDialog } from "@/components/CreateFarmDialog";
import { ImageUploader } from "@/components/media/ImageUploader";
import { AssetGallery } from "@/components/media/AssetGallery";
import { AssetThumb } from "@/components/media/AssetThumb";

const certLabel: Record<string, string> = {
  NONE: "Chưa có",
  PENDING: "Đang chờ",
  VIETGAP: "VietGAP",
  GLOBALGAP: "GlobalGAP",
  ORGANIC: "Hữu cơ",
};

export default function FarmsManagement() {
  const [search, setSearch] = useState("");
  const [editFarm, setEditFarm] = useState<Farm | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    area_hectares: "",
    certification_status: "NONE",
    status: "ACTIVE",
  });

  const { data, isLoading } = useFarms();
  const updateFarm = useUpdateFarm();
  const deleteFarm = useDeleteFarm();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: usersData } = useUsers(isAdmin ? { limit: 100 } : undefined);
  const userMap = new Map(
    (usersData?.items ?? []).map((u) => [u.id, u.full_name]),
  );

  const farms = data?.items ?? [];
  const filtered = farms.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.address ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const openEdit = (farm: Farm) => {
    setEditFarm(farm);
    setEditForm({
      name: farm.name,
      address: farm.address ?? "",
      area_hectares: farm.area_hectares ?? "",
      certification_status: farm.certification_status ?? "NONE",
      status: farm.status ?? "ACTIVE",
    });
  };

  const handleUpdate = async () => {
    if (!editFarm) return;
    try {
      await updateFarm.mutateAsync({
        id: editFarm.id,
        body: {
          name: editForm.name || undefined,
          address: editForm.address || undefined,
          area_hectares: editForm.area_hectares || undefined,
          certification_status: editForm.certification_status || undefined,
          status: editForm.status || undefined,
        },
      });
      toast.success("Cập nhật trang trại thành công");
      setEditFarm(null);
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa trang trại này?")) return;
    try {
      await deleteFarm.mutateAsync(id);
      toast.success("Đã xóa trang trại");
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quản lý trang trại</h1>
          <p className="text-sm text-muted-foreground">Quản lý các trang trại đã đăng ký</p>
        </div>
        <CreateFarmDialog />
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm trang trại..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  <TableHead className="w-14">Ảnh</TableHead>
                  <TableHead>Tên</TableHead>
                  {isAdmin && <TableHead>Chủ sở hữu</TableHead>}
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Diện tích</TableHead>
                  <TableHead>Chứng nhận</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <AssetThumb refType="FARM_PHOTO" refId={f.id} size={40} />
                    </TableCell>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-sm">
                        {userMap.get(f.owner_id) ?? "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-muted-foreground">{f.address}</TableCell>
                    <TableCell className="text-sm">{f.area_hectares ? `${f.area_hectares} ha` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {certLabel[f.certification_status] ?? f.certification_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                        {f.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(f)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(f.id)} disabled={deleteFarm.isPending}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy trang trại
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Farm Dialog */}
      <Dialog open={!!editFarm} onOpenChange={(open) => { if (!open) setEditFarm(null); }}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa trang trại</DialogTitle>
          </DialogHeader>
          {editFarm && (
            <div className="space-y-4">
              <div>
                <Label>Tên trang trại</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Địa chỉ</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Diện tích (Hecta)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editForm.area_hectares}
                    onChange={(e) => setEditForm((p) => ({ ...p, area_hectares: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Chứng nhận</Label>
                  <Select value={editForm.certification_status} onValueChange={(v) => setEditForm((p) => ({ ...p, certification_status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Chưa có</SelectItem>
                      <SelectItem value="PENDING">Đang chờ</SelectItem>
                      <SelectItem value="VIETGAP">VietGAP</SelectItem>
                      <SelectItem value="GLOBALGAP">GlobalGAP</SelectItem>
                      <SelectItem value="ORGANIC">Hữu cơ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="INACTIVE">Ngưng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleUpdate} disabled={updateFarm.isPending}>
                {updateFarm.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Lưu thay đổi
              </Button>

              <div className="pt-4 border-t space-y-3">
                <Label>Ảnh trang trại</Label>
                <AssetGallery
                  refType="FARM_PHOTO"
                  refId={editFarm.id}
                  editable
                  emptyText="Chưa có ảnh"
                />
                <ImageUploader
                  refType="FARM_PHOTO"
                  refId={editFarm.id}
                  maxFiles={5}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
