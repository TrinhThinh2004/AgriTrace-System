"use client";
import { Badge } from "@/components/ui/badge";
import type { BatchStatus } from "@/lib/api/product";
import { cn } from "@/lib/utils";

const statusConfig: Record<BatchStatus, { label: string; className: string }> = {
  SEEDING: { label: "Gieo trồng", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  GROWING: { label: "Đang phát triển", className: "bg-info/10 text-info border-info/20" },
  HARVESTED: { label: "Đã thu hoạch", className: "bg-warning/10 text-warning border-warning/20" },
  INSPECTED: { label: "Đã kiểm định", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  PACKED: { label: "Đã đóng gói", className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  SHIPPED: { label: "Đã xuất kho", className: "bg-success/10 text-success border-success/20" },
};

export function StatusBadge({ status }: { status: BatchStatus }) {
  const config = statusConfig[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
