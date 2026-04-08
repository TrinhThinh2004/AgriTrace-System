"use client";
import { useParams, useRouter } from "next/navigation";
import { mockBatches } from "@/lib/mockData";
import { TimelineStep } from "@/components/TimelineStep";
import { StatusBadge } from "@/components/StatusBadge";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Leaf, Sprout, Package, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { title: "Seed Information", description: "Crop variety, planting date, area", icon: Sprout },
  { title: "Cultivation Log", description: "Fertilizer, pesticide - VietGAP checklist", icon: Leaf },
  { title: "Harvest", description: "Date, actual yield, notes", icon: Package },
  { title: "Packaging & QR", description: "Package info & QR export", icon: ShieldCheck },
];

const vietGAPChecklist = [
  "Approved fertilizer used",
  "Pesticide within safety limits",
  "Water quality tested",
  "Soil analysis completed",
  "No prohibited chemicals used",
  "Worker safety protocols followed",
];

export default function BatchDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  const batch = mockBatches.find(b => b.id === id);

  if (!batch) return <div className="text-center py-12 text-muted-foreground">Batch not found</div>;

  const handleSign = () => {
    toast({ title: "Signed & Submitted", description: "Step data has been signed and submitted." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono">{batch.batchCode}</h1>
            <StatusBadge status={batch.status} />
          </div>
          <p className="text-sm text-muted-foreground">{batch.cropVariety} · {batch.farmName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Progress</CardTitle></CardHeader>
          <CardContent>
            {steps.map((s, i) => (
              <TimelineStep
                key={i}
                step={i + 1}
                title={s.title}
                description={s.description}
                status={i + 1 < batch.currentStep ? "completed" : i + 1 === batch.currentStep ? "current" : "upcoming"}
                isLast={i === 3}
              />
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Tabs defaultValue="step1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="step1">Seed Info</TabsTrigger>
              <TabsTrigger value="step2">Cultivation</TabsTrigger>
              <TabsTrigger value="step3">Harvest</TabsTrigger>
              <TabsTrigger value="step4">Packaging</TabsTrigger>
            </TabsList>

            <TabsContent value="step1">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Crop Variety</Label><Input defaultValue={batch.cropVariety} /></div>
                    <div><Label>Planting Date</Label><Input type="date" defaultValue={batch.plantingDate} /></div>
                    <div><Label>Area (ha)</Label><Input defaultValue={batch.area.replace(" ha", "")} /></div>
                    <div><Label>Seed Source</Label><Input defaultValue="Vietnam Seed Corp" /></div>
                  </div>
                  <Button onClick={handleSign} className="w-full">Sign & Submit Step 1</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="step2">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-medium text-sm">VietGAP Compliance Checklist</h3>
                  <div className="space-y-3">
                    {vietGAPChecklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Checkbox id={`check-${i}`} defaultChecked={i < 4} />
                        <label htmlFor={`check-${i}`} className="text-sm">{item}</label>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Fertilizer Used</Label><Input defaultValue="NPK 20-20-15" /></div>
                    <div><Label>Application Date</Label><Input type="date" defaultValue="2024-03-15" /></div>
                  </div>
                  <Textarea placeholder="Additional cultivation notes..." rows={3} />
                  <Button onClick={handleSign} className="w-full">Sign & Submit Step 2</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="step3">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Harvest Date</Label><Input type="date" defaultValue={batch.harvestDate || ""} /></div>
                    <div><Label>Actual Yield (tons)</Label><Input defaultValue="3.2" /></div>
                    <div><Label>Quality Grade</Label><Input defaultValue="Grade A" /></div>
                    <div><Label>Storage Method</Label><Input defaultValue="Cold storage 4°C" /></div>
                  </div>
                  <Textarea placeholder="Harvest notes and observations..." rows={3} defaultValue="Good quality harvest. No pest damage observed." />
                  <Button onClick={handleSign} className="w-full">Sign & Submit Step 3</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="step4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Package Type</Label><Input defaultValue="25kg bags" /></div>
                    <div><Label>Total Packages</Label><Input defaultValue="128" /></div>
                    <div><Label>Packaging Date</Label><Input type="date" defaultValue="2024-06-22" /></div>
                    <div><Label>Expiry Date</Label><Input type="date" defaultValue="2025-06-22" /></div>
                  </div>
                  <div className="flex justify-center py-4">
                    <QRCodeDisplay code={batch.batchCode} size={140} />
                  </div>
                  <Button onClick={handleSign} className="w-full">Sign & Submit Step 4</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
