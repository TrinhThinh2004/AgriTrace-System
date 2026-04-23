"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/media/ImageUploader";
import { AssetGallery } from "@/components/media/AssetGallery";
import { AssetThumb } from "@/components/media/AssetThumb";
import {
  ImagesPickerPreview,
  type PickedFile,
} from "@/components/media/ImagesPickerPreview";
import { useUploadAsset } from "@/hooks/use-media";
import {
  useCropCategories,
  useCreateCropCategory,
  useUpdateCropCategory,
  useDeleteCropCategory,
} from "@/hooks/use-crop-categories";
import { useState } from "react";
import { toast } from "sonner";
import type { CropCategory } from "@/lib/api/product";

export default function CropCategories() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CropCategory | null>(null);

  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [createImages, setCreateImages] = useState<PickedFile[]>([]);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "ACTIVE" });

  const { data, isLoading } = useCropCategories();
  const createCrop = useCreateCropCategory();
  const updateCrop = useUpdateCropCategory();
  const deleteCrop = useDeleteCropCategory();
  const uploadAsset = useUploadAsset();

  const resetCreateImages = () => {
    createImages.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setCreateImages([]);
  };

  const categories = data?.items ?? [];
  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("Tên loại cây trồng là bắt buộc");
      return;
    }
    try {
      const cat = await createCrop.mutateAsync({
        name: createForm.name,
        description: createForm.description || undefined,
      });

      if (createImages.length > 0) {
        let uploaded = 0;
        for (const item of createImages) {
          try {
            await uploadAsset.mutateAsync({
              file: item.file,
              ref_type: "CROP_PHOTO",
              ref_id: cat.id,
            });
            uploaded++;
          } catch (e: any) {
            toast.error(`Upload ${item.file.name} thất bại`, {
              description: e.message,
            });
          }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} ảnh`);
      }

      toast.success("Thêm loại cây trồng thành công");
      setCreateOpen(false);
      setCreateForm({ name: "", description: "" });
      resetCreateImages();
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  const openEdit = (cat: CropCategory) => {
    setEditCategory(cat);
    setEditForm({
      name: cat.name,
      description: cat.description ?? "",
      status: cat.status ?? "ACTIVE",
    });
  };

  const handleUpdate = async () => {
    if (!editCategory) return;
    try {
      await updateCrop.mutateAsync({
        id: editCategory.id,
        body: {
          name: editForm.name || undefined,
          description: editForm.description || undefined,
          status: editForm.status || undefined,
        },
      });
      toast.success("Cập nhật thành công");
      setEditCategory(null);
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa loại cây trồng này?")) return;
    try {
      await deleteCrop.mutateAsync(id);
      toast.success("Đã xóa loại cây trồng");
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Loại cây trồng</h1>
          <p className="text-sm text-muted-foreground">Quản lý danh mục loại cây trồng</p>
        </div>

        {/* Create Dialog */}
        <Dialog
          open={createOpen}
          onOpenChange={(o) => {
            if (!o) resetCreateImages();
            setCreateOpen(o);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Thêm loại cây
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm loại cây trồng mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên loại cây *</Label>
                <Input
                  placeholder="VD: Lúa, Cà phê, Tiêu..."
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  placeholder="Mô tả về loại cây trồng..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ảnh minh hoạ</Label>
                <ImagesPickerPreview
                  value={createImages}
                  onChange={setCreateImages}
                  disabled={createCrop.isPending || uploadAsset.isPending}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createCrop.isPending || uploadAsset.isPending}
              >
                {(createCrop.isPending || uploadAsset.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                )}
                Tạo loại cây trồng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm loại cây..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <AssetThumb refType="CROP_PHOTO" refId={c.id} size={40} />
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                        {c.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)} disabled={deleteCrop.isPending}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy loại cây trồng
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editCategory} onOpenChange={(open) => { if (!open) setEditCategory(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa loại cây trồng</DialogTitle>
          </DialogHeader>
          {editCategory && (
            <div className="space-y-4">
              <div>
                <Label>Tên loại cây</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
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
              <Button className="w-full" onClick={handleUpdate} disabled={updateCrop.isPending}>
                {updateCrop.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Lưu thay đổi
              </Button>

              <div className="pt-4 border-t space-y-3">
                <Label>Ảnh minh hoạ</Label>
                <AssetGallery
                  refType="CROP_PHOTO"
                  refId={editCategory.id}
                  editable
                  emptyText="Chưa có ảnh"
                />
                <ImageUploader
                  refType="CROP_PHOTO"
                  refId={editCategory.id}
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
