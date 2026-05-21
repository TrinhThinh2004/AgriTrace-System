"use client";
import { useEffect, useMemo, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useMessages,
  useSendMessage,
  useMarkConversationRead,
} from "@/hooks/use-messages";
import type { BeConversation } from "@/lib/api/messages";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

interface Props {
  conversation: BeConversation | null;
  currentUserId: string;
  onBack?: () => void;
}

function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase();
}

const TIME_GAP_MS = 5 * 60 * 1000; // 5 phút giữa 2 bubble → hiện time

export function MessageThread({ conversation, currentUserId, onBack }: Props) {
  const conversationId = conversation?.id ?? null;
  const { data, isLoading } = useMessages(conversationId);
  const sendMutation = useSendMessage(conversationId ?? "");
  const markRead = useMarkConversationRead();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // BE trả DESC → đảo lại cho UI hiển thị cũ → mới
  const messages = useMemo(() => {
    if (!data?.items) return [];
    return [...data.items].reverse();
  }, [data]);

  // Auto scroll xuống cuối khi có tin mới hoặc đổi conversation
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, conversationId]);

  // Đánh dấu đã đọc khi mở conversation (nếu có unread)
  useEffect(() => {
    if (conversationId && conversation && conversation.unread_count > 0) {
      markRead.mutate(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversation?.unread_count]);

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground flex-col gap-3 px-4 text-center">
        <MessagesSquare className="h-12 w-12 opacity-40" />
        <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-card shrink-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-9 w-9">
          <AvatarImage src={conversation.other_user.avatar_url || undefined} />
          <AvatarFallback>
            {initials(conversation.other_user.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">
            {conversation.other_user.full_name || conversation.other_user.email}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {conversation.other_user.role || ""}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            Chưa có tin nhắn. Hãy chào hỏi nào!
          </div>
        ) : (
          messages.map((m, idx) => {
            const next = messages[idx + 1];
            const showTime =
              !next ||
              next.sender_id !== m.sender_id ||
              new Date(next.created_at).getTime() -
                new Date(m.created_at).getTime() >
                TIME_GAP_MS;
            return (
              <MessageBubble
                key={m.id}
                content={m.content}
                createdAt={m.created_at}
                mine={m.sender_id === currentUserId}
                showTime={showTime}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={(c) => sendMutation.mutate(c)}
        sending={sendMutation.isPending}
      />
    </div>
  );
}
