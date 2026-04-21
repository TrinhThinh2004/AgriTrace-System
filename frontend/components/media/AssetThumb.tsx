"use client";
import { ImageOff } from "lucide-react";
import { useAssetsByRef } from "@/hooks/use-media";
import type { AssetRefType } from "@/lib/api/media";

interface AssetThumbProps {
  refType: AssetRefType;
  refId: string;
  size?: number;
  className?: string;
}

export function AssetThumb({
  refType,
  refId,
  size = 40,
  className,
}: AssetThumbProps) {
  const { data, isLoading } = useAssetsByRef(refType, refId);
  const first = data?.items?.[0];

  const style = { width: size, height: size };

  if (isLoading) {
    return (
      <div
        className={`rounded-md bg-muted animate-pulse ${className ?? ""}`}
        style={style}
      />
    );
  }

  if (!first) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-muted text-muted-foreground/50 ${className ?? ""}`}
        style={style}
      >
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={first.secure_url}
      alt=""
      className={`rounded-md object-cover ${className ?? ""}`}
      style={style}
    />
  );
}
