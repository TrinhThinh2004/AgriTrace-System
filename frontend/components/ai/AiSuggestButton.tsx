"use client";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClick: () => void;
  isPending?: boolean;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "default";
}

export function AiSuggestButton({
  onClick,
  isPending,
  disabled,
  label = "Gợi ý từ AI",
  size = "sm",
}: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={disabled || isPending}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 text-violet-500" />
      )}
      {isPending ? "Đang nghĩ…" : label}
    </Button>
  );
}
