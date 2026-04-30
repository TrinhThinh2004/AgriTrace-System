"use client";
import { useRouter } from "next/navigation";
import {
  Trash2,
  CheckCheck,
  Inbox,
  ClipboardCheck,
  ClipboardList,
  UserCog,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useDeleteNotification,
} from "@/hooks/use-notifications";
import type { BeNotification } from "@/lib/api/notification";

interface Props {
  onItemClick?: () => void;
}

const ICON_MAP: Record<string, { icon: LucideIcon; color: string }> = {
  INSPECTION_CREATED: {
    icon: ClipboardList,
    color: "text-blue-500 bg-blue-500/10",
  },
  INSPECTION_RESULT: {
    icon: ClipboardCheck,
    color: "text-emerald-500 bg-emerald-500/10",
  },
  USER_ACCOUNT_UPDATE: {
    icon: UserCog,
    color: "text-amber-500 bg-amber-500/10",
  },
};

export function NotificationPanel({ onItemClick }: Props) {
  const router = useRouter();
  const { data, isLoading } = useNotifications({ page: 1, limit: 10 });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const remove = useDeleteNotification();

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const hasUnread = items.some((n) => !n.is_read);

  const handleClick = (n: BeNotification) => {
    if (!n.is_read) markAsRead.mutate(n.id);
    if (n.link) router.push(n.link);
    onItemClick?.();
  };

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm font-semibold truncate">
            Thông báo
            {total > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({total})
              </span>
            )}
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1 text-[11px] text-primary hover:text-primary shrink-0"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Đọc tất cả
          </Button>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="p-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 py-8 text-muted-foreground">
          <Inbox className="h-10 w-10 opacity-50" />
          <p className="text-sm">Chưa có thông báo nào</p>
        </div>
      ) : (
        <ScrollArea className="max-h-96">
          <ul className="divide-y">
            {items.map((n) => {
              const meta = ICON_MAP[n.type] ?? {
                icon: Bell,
                color: "text-muted-foreground bg-muted",
              };
              const Icon = meta.icon;
              return (
                <li
                  key={n.id}
                  className={`group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/60 ${
                    n.is_read
                      ? ""
                      : "bg-primary/[0.07] border-l-2 border-l-primary"
                  }`}
                  onClick={() => handleClick(n)}
                >
                  {/* Icon column */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content column */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p
                      className={`text-sm leading-snug truncate ${
                        n.is_read ? "font-normal" : "font-semibold"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {formatRelative(n.created_at)}
                    </p>
                  </div>

                  {/* Action column */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove.mutate(n.id);
                    }}
                    className="shrink-0 self-start p-2 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/15 transition-colors"
                    aria-label="Xoá thông báo"
                    title="Xoá"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}
