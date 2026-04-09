import { Badge } from "@/components/ui/badge";
import type { BatchStatus } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const statusConfig: Record<BatchStatus, { label: string; className: string }> = {
  draft: { label: "Nháp", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "Đang xử lý", className: "bg-info/10 text-info border-info/20" },
  completed: { label: "Hoàn thành", className: "bg-warning/10 text-warning border-warning/20" },
  certified: { label: "Đạt chuẩn", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Từ chối", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function StatusBadge({ status }: { status: BatchStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
