"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { SignaturePanel } from "@/components/SignaturePanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { useBatches } from "@/hooks/use-batches";
import { useFarms } from "@/hooks/use-farms";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_ORDER: Record<string, number> = {
  SEEDING: 1, GROWING: 2, HARVESTED: 3, INSPECTED: 4, PACKED: 5, SHIPPED: 6,
};

export default function InspectorDashboard() {
  const router = useRouter();
  const { data: batchData, isLoading } = useBatches();
  const { data: farmData } = useFarms();
  const [selected, setSelected] = useState<string | null>(null);

  const batches = batchData?.items ?? [];
  const farms = farmData?.items ?? [];

  // Inspector xem các batch cần kiểm định (HARVESTED) hoặc đang xử lý
  const pendingBatches = batches.filter((b) => ["GROWING", "HARVESTED", "INSPECTED"].includes(b.status));
  const selectedBatch = batches.find((b) => b.id === selected);
  const selectedFarm = selectedBatch ? farms.find((f) => f.id === selectedBatch.farm_id) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kiểm định viên</h1>
        <p className="text-sm text-muted-foreground">Xem xét và chứng nhận các lô sản xuất</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Chờ xem xét ({pendingBatches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lô hàng</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Bước</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBatches.map((b) => (
                    <TableRow key={b.id} className={selected === b.id ? "bg-accent" : ""}>
                      <TableCell className="font-mono text-sm">{b.batch_code}</TableCell>
                      <TableCell className="text-sm">{b.name}</TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                      <TableCell className="text-sm">{STATUS_ORDER[b.status] ?? 1}/6</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(b.id)}>
                          <Eye className="h-4 w-4 mr-1" /> Xem xét
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedBatch ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-mono">{selectedBatch.batch_code}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Tên</span><span>{selectedBatch.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Trang trại</span><span>{selectedFarm?.name ?? "—"}</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày trồng</span>
                    <span>{selectedBatch.planting_date ? new Date(selectedBatch.planting_date).toLocaleDateString("vi-VN") : "—"}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Đơn vị</span><span>{selectedBatch.unit}</span></div>
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => router.push(`/batch/${selectedBatch.id}`)}>
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
              <SignaturePanel batchId={selectedBatch.id} />
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Chọn lô hàng để xem xét</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
