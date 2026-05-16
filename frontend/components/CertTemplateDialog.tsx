"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  useCreateCertTemplate,
  useUpdateCertTemplate,
} from "@/hooks/use-certification";
import type {
  CertType,
  CertificationTemplate,
  CreateTemplateItemBody,
} from "@/lib/api/certification";

interface ItemDraft extends CreateTemplateItemBody {
  _key: string;
}

const newItem = (): ItemDraft => ({
  _key: Math.random().toString(36).slice(2),
  category: "",
  code: "",
  title: "",
  description: "",
  required: true,
  evidence_required: false,
});

export function CreateTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateCertTemplate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [certType, setCertType] = useState<CertType>("VIETGAP");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([newItem()]);

  useEffect(() => {
    if (!open) {
      setCode("");
      setName("");
      setCertType("VIETGAP");
      setDescription("");
      setItems([newItem()]);
    }
  }, [open]);

  const updateItem = (key: string, patch: Partial<ItemDraft>) =>
    setItems((prev) =>
      prev.map((it) => (it._key === key ? { ...it, ...patch } : it)),
    );

  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((it) => it._key !== key));

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error("Vui lòng nhập code và tên template");
      return;
    }
    const cleanItems = items
      .filter((it) => it.category.trim() && it.code.trim() && it.title.trim())
      .map(({ _key, ...rest }, idx) => ({ ...rest, order: idx + 1 }));
    if (cleanItems.length === 0) {
      toast.error("Cần ít nhất 1 tiêu chí (category + code + title)");
      return;
    }
    try {
      await create.mutateAsync({
        code: code.trim(),
        name: name.trim(),
        cert_type: certType,
        description: description.trim() || undefined,
        active: true,
        items: cleanItems,
      });
      toast.success("Đã tạo template");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Tạo thất bại", { description: e.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo template chứng nhận</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mã code *</Label>
              <Input
                placeholder="VD: VIETGAP_FRUIT_V1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <Label>Loại chứng nhận *</Label>
              <Select
                value={certType}
                onValueChange={(v) => setCertType(v as CertType)}
              >
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
          </div>
          <div>
            <Label>Tên template *</Label>
            <Input
              placeholder="VD: VietGAP - Cây ăn quả"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về template..."
              maxLength={500}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tiêu chí ({items.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItems((p) => [...p, newItem()])}
              >
                <Plus className="h-3 w-3 mr-1" />
                Thêm tiêu chí
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={it._key} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Tiêu chí #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(it._key)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Category (VD: Đất trồng)"
                      value={it.category}
                      onChange={(e) =>
                        updateItem(it._key, { category: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Code (VD: SOIL_001)"
                      value={it.code}
                      onChange={(e) =>
                        updateItem(it._key, { code: e.target.value })
                      }
                    />
                  </div>
                  <Input
                    placeholder="Title tiêu chí"
                    value={it.title}
                    onChange={(e) =>
                      updateItem(it._key, { title: e.target.value })
                    }
                  />
                  <Textarea
                    rows={2}
                    placeholder="Mô tả chi tiết tiêu chí (optional)"
                    value={it.description ?? ""}
                    onChange={(e) =>
                      updateItem(it._key, { description: e.target.value })
                    }
                  />
                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={it.required}
                        onCheckedChange={(v) =>
                          updateItem(it._key, { required: v === true })
                        }
                      />
                      Bắt buộc
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={it.evidence_required}
                        onCheckedChange={(v) =>
                          updateItem(it._key, {
                            evidence_required: v === true,
                          })
                        }
                      />
                      Cần ảnh chứng minh
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            )}
            Tạo template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditTemplateDialog({
  template,
  open,
  onOpenChange,
}: {
  template: CertificationTemplate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateCertTemplate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (template && open) {
      setName(template.name);
      setDescription(template.description ?? "");
      setActive(template.active);
    }
  }, [template, open]);

  const handleSubmit = async () => {
    if (!template) return;
    if (!name.trim()) {
      toast.error("Tên không được rỗng");
      return;
    }
    try {
      await update.mutateAsync({
        id: template.id,
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          active,
        },
      });
      toast.success("Đã cập nhật template");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Cập nhật thất bại", { description: e.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Mã code</Label>
            <p className="text-sm font-mono text-muted-foreground">
              {template?.code}
            </p>
          </div>
          <div>
            <Label>Tên *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Active</Label>
              <p className="text-xs text-muted-foreground">
                Tắt để ẩn template khỏi danh sách farmer chọn.
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={update.isPending}>
            {update.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            )}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
