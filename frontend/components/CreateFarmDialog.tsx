"use client";
import { useState } from "react";
import { useCreateFarm } from "@/hooks/use-farms";
import { useUploadAsset } from "@/hooks/use-media";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import {
  ImagesPickerPreview,
  type PickedFile,
} from "@/components/media/ImagesPickerPreview";

const INITIAL_FORM = {
  name: "",
  address: "",
  area_hectares: "",
  certification_status: "NONE",
};

export function CreateFarmDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [images, setImages] = useState<PickedFile[]>([]);
  const createFarm = useCreateFarm();
  const uploadAsset = useUploadAsset();

  const resetImages = () => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Tên trang trại là bắt buộc");
      return;
    }
    try {
      const farm = await createFarm.mutateAsync({
        name: form.name,
        address: form.address || undefined,
        area_hectares: form.area_hectares || undefined,
        certification_status: form.certification_status,
      });

      if (images.length > 0) {
        let uploaded = 0;
        for (const item of images) {
          try {
            await uploadAsset.mutateAsync({
              file: item.file,
              ref_type: "FARM_PHOTO",
              ref_id: farm.id,
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

      toast.success("Thêm trang trại thành công");
      setOpen(false);
      setForm(INITIAL_FORM);
      resetImages();
    } catch (e: any) {
      toast.error("Lỗi thêm trang trại", { description: e.message });
    }
  };

  const set = (key: keyof typeof INITIAL_FORM, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const busy = createFarm.isPending || uploadAsset.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetImages();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Thêm trang trại
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm trang trại mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tên trang trại *</Label>
            <Input
              placeholder="VD: Nông trại Xanh Đà Lạt"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div>
            <Label>Địa chỉ</Label>
            <Input
              placeholder="VD: 123 Đường Nam Kỳ Khởi Nghĩa, Đà Lạt"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Diện tích (Hecta)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="VD: 1.5"
                value={form.area_hectares}
                onChange={(e) => set("area_hectares", e.target.value)}
              />
            </div>
            <div>
              <Label>Chứng nhận</Label>
              <Select
                value={form.certification_status}
                onValueChange={(v) => set("certification_status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

          <div className="space-y-1.5">
            <Label>Ảnh trang trại</Label>
            <ImagesPickerPreview
              value={images}
              onChange={setImages}
              disabled={busy}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Lưu trang trại
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
