"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AvatarUploader } from "@/components/media/AvatarUploader";
import { useAuthStore } from "@/stores/auth-store";
import { useUpdateProfile } from "@/hooks/use-profile";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    bio: "",
    address: "",
  });

  useEffect(() => {
    if (open && user) {
      setForm({
        full_name: user.full_name ?? "",
        phone: user.phone ?? "",
        bio: user.bio ?? "",
        address: user.address ?? "",
      });
    }
  }, [open, user]);

  if (!user) return null;

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: form.full_name || undefined,
        phone: form.phone || undefined,
        bio: form.bio || undefined,
        address: form.address || undefined,
      });
      toast.success("Đã lưu thông tin");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Thông tin cá nhân</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <AvatarUploader
            userId={user.id}
            currentUrl={user.avatar_url}
            name={user.full_name}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Họ và tên</Label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input
                value={form.phone}
                placeholder="VD: 0901234567"
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Địa chỉ</Label>
              <Input
                value={form.address}
                placeholder="VD: 123 Nguyễn Trãi, Đà Lạt"
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Giới thiệu</Label>
              <Textarea
                rows={3}
                value={form.bio}
                placeholder="Vài dòng giới thiệu về bạn…"
                onChange={(e) =>
                  setForm((p) => ({ ...p, bio: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
