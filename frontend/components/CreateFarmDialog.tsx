"use client";
import { useState } from "react";
import { useCreateFarm } from "@/hooks/use-farms";
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

const INITIAL_FORM = {
  name: "",
  address: "",
  area_hectares: "",
  certification_status: "NONE",
};

export function CreateFarmDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const createFarm = useCreateFarm();

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Tên trang trại là bắt buộc");
      return;
    }
    try {
      await createFarm.mutateAsync({
        name: form.name,
        address: form.address || undefined,
        area_hectares: form.area_hectares || undefined,
        certification_status: form.certification_status,
      });
      toast.success("Thêm trang trại thành công");
      setOpen(false);
      setForm(INITIAL_FORM);
    } catch (e: any) {
      toast.error("Lỗi thêm trang trại", { description: e.message });
    }
  };

  const set = (key: keyof typeof INITIAL_FORM, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Thêm trang trại
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
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
              <Select value={form.certification_status} onValueChange={(v) => set("certification_status", v)}>
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

          <Button className="w-full" onClick={handleSubmit} disabled={createFarm.isPending}>
            {createFarm.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Lưu trang trại
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
