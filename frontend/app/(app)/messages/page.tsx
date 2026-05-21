"use client";
import { useMemo, useState } from "react";
import { useConversations } from "@/hooks/use-messages";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ConversationList } from "./_components/ConversationList";
import { MessageThread } from "./_components/MessageThread";
import { NewConversationDialog } from "./_components/NewConversationDialog";

export default function MessagesPage() {
  const { user } = useAuth();
  const { data, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const conversations = data?.items ?? [];
  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  // Mobile: nếu đã chọn conversation → ẩn list, hiện thread
  const showListOnMobile = !selectedId;

  return (
    <div className="h-[calc(100vh-7rem)] -m-3 sm:-m-4 lg:-m-6 flex border border-border rounded-md overflow-hidden bg-background">
      <aside
        className={cn(
          "w-full md:w-80 lg:w-96 shrink-0",
          showListOnMobile ? "block" : "hidden md:block",
        )}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNewConversation={() => setNewOpen(true)}
          isLoading={isLoading}
        />
      </aside>

      <section
        className={cn(
          "flex-1 flex flex-col min-w-0",
          showListOnMobile ? "hidden md:flex" : "flex",
        )}
      >
        <MessageThread
          conversation={selected}
          currentUserId={user?.id ?? ""}
          onBack={() => setSelectedId(null)}
        />
      </section>

      <NewConversationDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        currentUserId={user?.id ?? ""}
        onCreated={(id) => setSelectedId(id)}
      />
    </div>
  );
}
