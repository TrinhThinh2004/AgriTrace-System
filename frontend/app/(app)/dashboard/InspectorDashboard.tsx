"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { SignaturePanel } from "@/components/SignaturePanel";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { mockBatches } from "@/lib/mockData";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InspectorDashboard() {
  const router = useRouter();
  const pendingBatches = mockBatches.filter(b => b.status === "completed" || b.status === "in_progress");
  const [selected, setSelected] = useState<string | null>(null);
  const selectedBatch = mockBatches.find(b => b.id === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inspector Reviews</h1>
        <p className="text-sm text-muted-foreground">Review and certify production batches</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pending Reviews ({pendingBatches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBatches.map(b => (
                  <TableRow key={b.id} className={selected === b.id ? "bg-accent" : ""}>
                    <TableCell className="font-mono text-sm">{b.batchCode}</TableCell>
                    <TableCell className="text-sm">{b.cropVariety}</TableCell>
                    <TableCell className="text-sm">{b.farmName}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-sm">{b.currentStep}/4</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(b.id)}>
                        <Eye className="h-4 w-4 mr-1" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedBatch ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-mono">{selectedBatch.batchCode}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Crop</span><span>{selectedBatch.cropVariety}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Farm</span><span>{selectedBatch.farmName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Farmer</span><span>{selectedBatch.farmerName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Planted</span><span>{selectedBatch.plantingDate}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Area</span><span>{selectedBatch.area}</span></div>
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => router.push(`/batch/${selectedBatch.id}`)}>
                    View Full Details
                  </Button>
                </CardContent>
              </Card>
              <SignaturePanel />
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Select a batch to review</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
