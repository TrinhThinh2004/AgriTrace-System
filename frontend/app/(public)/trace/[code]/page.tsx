"use client";
import { useParams } from "next/navigation";
import { mockBatches } from "@/lib/mockData";
import { TimelineStep } from "@/components/TimelineStep";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Leaf, Sprout, Package, Tractor, CheckCircle } from "lucide-react";

const traceSteps = [
  { title: "Seed Origin", description: "Certified seed from Vietnam Seed Corp", icon: Sprout },
  { title: "Farm Cultivation", description: "VietGAP compliant cultivation process", icon: Tractor },
  { title: "Harvest & Quality", description: "Grade A quality, cold storage 4°C", icon: Leaf },
  { title: "Packaging", description: "Sealed and labeled for distribution", icon: Package },
  { title: "Certified", description: "Verified by certified inspector", icon: ShieldCheck },
];

export default function PublicTrace() {
  const { code } = useParams();
  const batch = mockBatches.find(b => b.batchCode === code || b.id === code) || mockBatches[0];

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Tractor className="h-6 w-6" />
            <span className="text-xl font-bold">AgriTrace</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Product Journey</h1>
          <p className="text-sm opacity-80">Trace the complete story of your product from seed to shelf</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto -mt-4 px-4 pb-12 space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono font-bold">{batch.batchCode}</p>
                <p className="text-lg font-semibold">{batch.cropVariety}</p>
              </div>
              <QRCodeDisplay code={batch.batchCode} size={80} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Farm</p>
                <p className="font-medium">{batch.farmName}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Area</p>
                <p className="font-medium">{batch.area}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Planted</p>
                <p className="font-medium">{batch.plantingDate}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Harvested</p>
                <p className="font-medium">{batch.harvestDate || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Product Timeline</h2>
            {traceSteps.map((s, i) => (
              <TimelineStep
                key={i}
                step={i + 1}
                title={s.title}
                description={s.description}
                status={i + 1 <= batch.currentStep ? "completed" : i + 1 === batch.currentStep + 1 ? "current" : "upcoming"}
                isLast={i === traceSteps.length - 1}
              />
            ))}
          </CardContent>
        </Card>

        {batch.status === "certified" && (
          <Card className="border-success/30">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
              <h3 className="font-semibold text-success">Digitally Verified</h3>
              <p className="text-sm text-muted-foreground mt-1">This product has been certified by an authorized inspector</p>
              <Badge className="mt-2 bg-success text-success-foreground">VietGAP Certified</Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
