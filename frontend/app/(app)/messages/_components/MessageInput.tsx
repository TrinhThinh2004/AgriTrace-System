"use client";
import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
  sending?: boolean;
}

export function MessageInput({ onSend, disabled, sending }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-3 border-t border-border bg-card shrink-0">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder="Nhập tin nhắn…"
        disabled={disabled || sending}
        maxLength={5000}
        className="flex-1"
      />
      <Button
        type="button"
        size="icon"
        onClick={submit}
        disabled={disabled || sending || !value.trim()}
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
