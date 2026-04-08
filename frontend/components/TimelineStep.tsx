import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStepProps {
  step: number;
  title: string;
  description?: string;
  status: "completed" | "current" | "upcoming";
  isLast?: boolean;
}

export function TimelineStep({ step, title, description, status, isLast }: TimelineStepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
          status === "completed" && "bg-primary border-primary text-primary-foreground",
          status === "current" && "border-primary text-primary bg-primary/10",
          status === "upcoming" && "border-muted-foreground/30 text-muted-foreground"
        )}>
          {status === "completed" ? <Check className="h-4 w-4" /> : step}
        </div>
        {!isLast && (
          <div className={cn(
            "w-0.5 flex-1 min-h-[2rem]",
            status === "completed" ? "bg-primary" : "bg-border"
          )} />
        )}
      </div>
      <div className="pb-6">
        <p className={cn(
          "font-medium text-sm",
          status === "upcoming" && "text-muted-foreground"
        )}>{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
