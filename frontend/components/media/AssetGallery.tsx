"use client";
import { toast } from "sonner";
import { Loader2, Trash2, ImageOff } from "lucide-react";
import { useAssetsByRef, useDeleteAsset } from "@/hooks/use-media";
import type { AssetRefType } from "@/lib/api/media";
import { ApiError } from "@/lib/api/client";

interface AssetGalleryProps {
  refType: AssetRefType;
  refId: string | undefined;
  editable?: boolean;
  emptyText?: string;
  hideWhenEmpty?: boolean;
}

export function AssetGallery({
  refType,
  refId,
  editable = false,
  emptyText = "Chưa có ảnh",
  hideWhenEmpty = false,
}: AssetGalleryProps) {
  const { data, isLoading, isError } = useAssetsByRef(refType, refId);
  const del = useDeleteAsset();

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá ảnh này?")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Đã xoá ảnh");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Xoá thất bại";
      toast.error(msg);
    }
  };

  if (!refId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải ảnh…
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-4 text-sm text-destructive">Không tải được ảnh</p>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div className="flex flex-col items-center gap-1 py-6 text-muted-foreground">
        <ImageOff className="h-6 w-6" />
        <p className="text-sm">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {items.map((asset) => (
        <div
          key={asset.id}
          className="group relative overflow-hidden rounded-md border bg-muted"
        >
          <a
            href={asset.secure_url}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.secure_url}
              alt={asset.original_filename ?? "Ảnh"}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
            />
          </a>
          {editable && (
            <button
              type="button"
              onClick={() => handleDelete(asset.id)}
              disabled={del.isPending}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50"
              aria-label="Xoá ảnh"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
