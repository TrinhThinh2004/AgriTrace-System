"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUploadAsset } from "@/hooks/use-media";
import { useUpdateProfile } from "@/hooks/use-profile";
import { ApiError } from "@/lib/api/client";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface AvatarUploaderProps {
  userId: string;
  currentUrl?: string | null;
  name?: string;
  size?: number;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AvatarUploader({
  userId,
  currentUrl,
  name,
  size = 96,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const upload = useUploadAsset();
  const updateProfile = useUpdateProfile();

  const busy = upload.isPending || updateProfile.isPending;
  const displayUrl = previewUrl ?? currentUrl ?? undefined;

  const handleFile = async (file: File) => {
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error("Định dạng không hỗ trợ (chỉ JPG/PNG/WEBP)");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Ảnh vượt quá 5MB");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const asset = await upload.mutateAsync({
        file,
        ref_type: "USER_AVATAR",
        ref_id: userId,
      });
      await updateProfile.mutateAsync({ avatar_url: asset.secure_url });
      toast.success("Đã cập nhật ảnh đại diện");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Cập nhật thất bại";
      toast.error(msg);
      setPreviewUrl(null);
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="shrink-0" style={{ width: size, height: size }}>
        {displayUrl ? (
          <AvatarImage src={displayUrl} alt={name ?? "avatar"} />
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {getInitials(name)}
          </AvatarFallback>
        )}
      </Avatar>

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME.join(",")}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          {busy ? "Đang tải…" : "Đổi ảnh đại diện"}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG/PNG/WEBP, tối đa 5MB
        </p>
      </div>
    </div>
  );
}
