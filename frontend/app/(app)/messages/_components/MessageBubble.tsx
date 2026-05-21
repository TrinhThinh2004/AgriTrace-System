"use client";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  createdAt: string;
  mine: boolean;
  showTime: boolean;
}

export function MessageBubble({ content, createdAt, mine, showTime }: Props) {
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap wrap-break-word",
          mine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {content}
      </div>
      {showTime && (
        <span className="text-[10px] text-muted-foreground mt-1 px-1">
          {new Date(createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  );
}
