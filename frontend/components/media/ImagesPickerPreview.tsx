"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export interface PickedFile {
  file: File;
  previewUrl: string;
}

interface ImagesPickerPreviewProps {
  value: PickedFile[];
  onChange: (files: PickedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function ImagesPickerPreview({
  value,
  onChange,
  maxFiles = 5,
  disabled,
}: ImagesPickerPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: PickedFile[] = [];
    for (const file of Array.from(files)) {
      if (value.length + next.length >= maxFiles) {
        toast.error(`Tối đa ${maxFiles} ảnh`);
        break;
      }
      if (!ALLOWED_MIME.includes(file.type)) {
        toast.error(`${file.name}: định dạng không hỗ trợ`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: vượt quá 5MB`);
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    if (next.length > 0) onChange([...value, ...next]);
  };

  const remove = (idx: number) => {
    const target = value[idx];
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-md border-2 border-dashed p-4 text-center transition-colors ${
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
        <ImagePlus className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Kéo thả hoặc bấm để chọn ảnh (JPG/PNG/WEBP, ≤5MB, tối đa {maxFiles})
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {value.map((item, idx) => (
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
                onClick={() => remove(idx)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label="Xoá"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
