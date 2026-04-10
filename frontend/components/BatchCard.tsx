"use client";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Batch } from "@/lib/api/product";

const STATUS_ORDER: Record<string, number> = {
  SEEDING: 1,
  GROWING: 2,
  HARVESTED: 3,
  INSPECTED: 4,
  PACKED: 5,
  SHIPPED: 6,
};

export function BatchCard({ batch, farmName }: { batch: Batch; farmName?: string }) {
  const router = useRouter();
  const currentStep = STATUS_ORDER[batch.status] ?? 1;

  return (
    <Card className="hover:shadow-md transition-shadow animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold">{batch.batch_code}</span>
              <StatusBadge status={batch.status} />
            </div>
            <p className="text-sm text-foreground">{batch.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {farmName ?? "—"} · {batch.unit}
            </p>
            {batch.planting_date && (
              <p className="text-xs text-muted-foreground">
                Ngày trồng: {new Date(batch.planting_date).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => router.push(`/batch/${batch.id}`)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= currentStep ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Bước {currentStep} / 6</p>
        </div>
      </CardContent>
    </Card>
  );
}
