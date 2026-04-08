import { Badge } from "@/components/ui/badge";
import type { BatchStatus } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const statusConfig: Record<BatchStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info border-info/20" },
  completed: { label: "Completed", className: "bg-warning/10 text-warning border-warning/20" },
  certified: { label: "Certified", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function StatusBadge({ status }: { status: BatchStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
