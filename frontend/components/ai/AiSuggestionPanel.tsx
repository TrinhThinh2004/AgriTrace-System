"use client";
import { Sparkles, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiSuggestion } from "@/lib/api/ai";
import { MarkdownLite } from "./MarkdownLite";

interface Props {
  data: AiSuggestion | null | undefined;
  isPending: boolean;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Panel hiển thị kết quả gợi ý AI. Render khi:
 *  - isPending=true → skeleton + "Đang phân tích..."
 *  - data có → markdown lite + footer (model + tokens)
 *  - Không render gì nếu cả 2 đều false (parent quyết định show/hide)
 */
export function AiSuggestionPanel({
  data,
  isPending,
  onRetry,
  onClose,
  className,
}: Props) {
  if (!isPending && !data) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-violet-200 bg-violet-50/40 p-3 text-sm",
        "dark:border-violet-900 dark:bg-violet-950/30",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300 font-medium">
          <Sparkles className="h-4 w-4" />
          <span>Gợi ý từ AI</span>
        </div>
        <div className="flex items-center gap-1">
          {onRetry && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRetry}
              disabled={isPending}
              title="Tạo lại"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          )}
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
              title="Đóng"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-violet-200/70 dark:bg-violet-900/40 rounded w-3/4" />
          <div className="h-3 bg-violet-200/70 dark:bg-violet-900/40 rounded w-full" />
          <div className="h-3 bg-violet-200/70 dark:bg-violet-900/40 rounded w-5/6" />
          <div className="h-3 bg-violet-200/70 dark:bg-violet-900/40 rounded w-2/3" />
        </div>
      ) : data ? (
        <>
          <MarkdownLite content={data.content} />
          <div className="mt-2 pt-2 border-t border-violet-200/60 dark:border-violet-900/60 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>{data.model}</span>
            <span>
              {data.tokens_used} tokens · {data.latency_ms}ms
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
