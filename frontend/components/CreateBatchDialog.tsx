"use client";
import { useState } from "react";
import { useCreateBatch } from "@/hooks/use-batches";
import { useFarms } from "@/hooks/use-farms";
import { useCropCategories } from "@/hooks/use-crop-categories";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

const INITIAL_FORM = {
  batch_code: "",
  farm_id: "",
  crop_category_id: "",
  name: "",
  planting_date: "",
  expected_harvest_date: "",
  unit: "kg",
  notes: "",
};

export function CreateBatchDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const createBatch = useCreateBatch();
  const { data: farmData } = useFarms();
  const { data: cropData } = useCropCategories();

  const farms = farmData?.items ?? [];
  const crops = (cropData?.items ?? []).filter((c) => c.status === "ACTIVE");

  const handleSubmit = async () => {
    if (!form.batch_code || !form.farm_id || !form.crop_category_id || !form.name) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    try {
      await createBatch.mutateAsync({
        batch_code: form.batch_code,
        farm_id: form.farm_id,
        crop_category_id: form.crop_category_id,
        name: form.name,
        planting_date: form.planting_date ? new Date(form.planting_date).toISOString() : undefined,
        expected_harvest_date: form.expected_harvest_date ? new Date(form.expected_harvest_date).toISOString() : undefined,
        unit: form.unit || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Tạo lô hàng thành công");
      setOpen(false);
      setForm(INITIAL_FORM);
    } catch (e: any) {
      toast.error("Lỗi tạo lô hàng", { description: e.message });
    }
  };

  const set = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Tạo lô mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo lô hàng mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mã lô *</Label>
              <Input
                placeholder="VD: AGT-2024-009"
                value={form.batch_code}
                onChange={(e) => set("batch_code", e.target.value)}
              />
            </div>
            <div>
              <Label>Tên lô *</Label>
              <Input
                placeholder="VD: Lúa vụ đông"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Trang trại *</Label>
              <Select value={form.farm_id} onValueChange={(v) => set("farm_id", v)}>
                <SelectTrigger><SelectValue placeholder="Chọn trang trại" /></SelectTrigger>
                <SelectContent>
                  {farms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại cây trồng *</Label>
              <Select value={form.crop_category_id} onValueChange={(v) => set("crop_category_id", v)}>
                <SelectTrigger><SelectValue placeholder="Chọn loại cây" /></SelectTrigger>
                <SelectContent>
                  {crops.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Ngày trồng</Label>
              <Input
                type="date"
                value={form.planting_date}
                onChange={(e) => set("planting_date", e.target.value)}
              />
            </div>
            <div>
              <Label>Dự kiến thu hoạch</Label>
              <Input
                type="date"
                value={form.expected_harvest_date}
                onChange={(e) => set("expected_harvest_date", e.target.value)}
              />
            </div>
            <div>
              <Label>Đơn vị</Label>
              <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="tấn">tấn</SelectItem>
                  <SelectItem value="bao">bao</SelectItem>
                  <SelectItem value="thùng">thùng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Ghi chú</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Ghi chú thêm về lô hàng..."
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={createBatch.isPending}>
            {createBatch.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Tạo lô hàng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
