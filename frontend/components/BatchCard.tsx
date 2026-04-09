"use client";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Batch } from "@/lib/mockData";

export function BatchCard({ batch }: { batch: Batch }) {
  const router = useRouter();
  const navigate = (p: string) => router.push(p);

  return (
    <Card className="hover:shadow-md transition-shadow animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold">{batch.batchCode}</span>
              <StatusBadge status={batch.status} />
            </div>
            <p className="text-sm text-foreground">{batch.cropVariety}</p>
            <p className="text-xs text-muted-foreground mt-1">{batch.farmName} · {batch.area}</p>
            <p className="text-xs text-muted-foreground">Ngày trồng: {batch.plantingDate}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/batch/${batch.id}`)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= batch.currentStep ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Bước {batch.currentStep} / 4</p>
        </div>
      </CardContent>
    </Card>
  );
}
