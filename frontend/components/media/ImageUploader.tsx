"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadAsset } from "@/hooks/use-media";
import type { Asset, AssetRefType } from "@/lib/api/media";
import { ApiError } from "@/lib/api/client";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageUploaderProps {
  refType: AssetRefType;
  refId?: string;
  maxFiles?: number;
  disabled?: boolean;
  onUploaded?: (asset: Asset) => void;
}

interface PendingItem {
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "error";
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ImageUploader({
  refType,
  refId,
  maxFiles = 5,
  disabled,
  onUploaded,
}: ImageUploaderProps) {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAsset();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted: PendingItem[] = [];
    for (const file of Array.from(files)) {
      if (accepted.length + items.length >= maxFiles) {
        toast.error(`Tối đa ${maxFiles} ảnh mỗi lần`);
        break;
      }
      if (!ALLOWED_MIME.includes(file.type)) {
        toast.error(`${file.name}: định dạng không hỗ trợ (chỉ JPG/PNG/WEBP)`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: vượt quá 5MB`);
        continue;
      }
      accepted.push({
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
      });
    }
    if (accepted.length > 0) setItems((prev) => [...prev, ...accepted]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const uploadAll = async () => {
    if (items.length === 0) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status !== "pending") continue;
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i ? { ...it, status: "uploading" } : it,
        ),
      );
      try {
        const asset = await upload.mutateAsync({
          file: item.file,
          ref_type: refType,
          ref_id: refId,
        });
        onUploaded?.(asset);
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Upload thất bại";
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: "error", error: msg } : it,
          ),
        );
        toast.error(`${item.file.name}: ${msg}`);
      }
    }
    // Xoá các item đã upload thành công
    setItems((prev) =>
      prev.filter((it) => {
        if (it.status === "uploading") {
          URL.revokeObjectURL(it.previewUrl);
          return false;
        }
        return true;
      }),
    );
  };

  const isBusy = upload.isPending;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME.join(",")}
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <ImagePlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Kéo thả hoặc bấm để chọn ảnh
        </p>
        <p className="text-xs text-muted-foreground/70">
          JPG/PNG/WEBP, tối đa 5MB, {maxFiles} ảnh
        </p>
      </div>

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-md border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={item.status === "uploading"}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 disabled:opacity-50"
                  aria-label="Xoá"
                >
                  <X className="h-3 w-3" />
                </button>
                {item.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
                {item.status === "error" && (
                  <div className="absolute inset-x-0 bottom-0 bg-red-500/80 px-1 py-0.5 text-xs text-white">
                    Lỗi
                  </div>
                )}
                <div className="px-1 py-0.5 text-[10px] text-muted-foreground">
                  {formatBytes(item.file.size)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={uploadAll}
              disabled={isBusy || disabled || items.every((it) => it.status !== "pending")}
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải…
                </>
              ) : (
                `Tải lên ${items.filter((it) => it.status === "pending").length} ảnh`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
