"use client";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search } from "lucide-react";
import {
  useContacts,
  useGetOrCreateConversation,
} from "@/hooks/use-messages";
import type { ContactItem } from "@/lib/api/messages";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: string;
  onCreated: (conversationId: string) => void;
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

export function NewConversationDialog({
  open,
  onOpenChange,
  currentUserId: _currentUserId,
  onCreated,
}: Props) {
  const [query, setQuery] = useState("");
  // Backend đã loại currentUser khỏi list, FE chỉ cần filter text
  const { data, isLoading, error } = useContacts();
  const createConv = useGetOrCreateConversation();

  const users = useMemo<ContactItem[]>(() => {
    const list = data?.items ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [data, query]);

  const handlePick = async (u: ContactItem) => {
    try {
      const conv = await createConv.mutateAsync(u.id);
      onCreated(conv.id);
      onOpenChange(false);
      setQuery("");
    } catch {
      // mutation error tự log trong React Query devtools
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Tin nhắn mới</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên hoặc email…"
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="max-h-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-8">
              Lỗi tải danh sách: {(error as Error).message}
            </p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Không tìm thấy người dùng
            </p>
          ) : (
            <ul className="py-1">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(u)}
                    disabled={createConv.isPending}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent transition-colors disabled:opacity-50",
                    )}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback>{initials(u.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {u.full_name || u.email}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {u.email} · {u.role}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
