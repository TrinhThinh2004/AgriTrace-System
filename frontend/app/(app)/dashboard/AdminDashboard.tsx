"use client";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Building2, ClipboardCheck, QrCode, Plus, MapPin, Loader2 } from "lucide-react";
import { useBatches } from "@/hooks/use-batches";
import { useFarms } from "@/hooks/use-farms";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: batchData, isLoading: batchLoading } = useBatches();
  const { data: farmData, isLoading: farmLoading } = useFarms();

  const batches = batchData?.items ?? [];
  const farms = farmData?.items ?? [];
  const isLoading = batchLoading || farmLoading;

  const certifiedFarms = farms.filter((f) => f.certification_status !== "NONE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trang quản trị</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hoạt động AgriTrace</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => router.push("/farms")}>
            <Plus className="h-4 w-4 mr-1" /> Thêm trang trại
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push("/crops")}>
            <Plus className="h-4 w-4 mr-1" /> Thêm loại cây
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Tổng lô hàng" value={batches.length} icon={<Package className="h-5 w-5" />} />
        <StatsCard title="Trang trại đạt chuẩn" value={certifiedFarms.length} icon={<Building2 className="h-5 w-5" />} description={`trên tổng ${farms.length}`} />
        <StatsCard title="Chờ kiểm định" value={batches.filter((b) => b.status === "HARVESTED").length} icon={<ClipboardCheck className="h-5 w-5" />} />
        <StatsCard title="Đã xuất kho" value={batches.filter((b) => b.status === "SHIPPED").length} icon={<QrCode className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lô hàng gần đây</CardTitle>
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
                    <TableHead>Mã lô</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.slice(0, 5).map((b) => (
                    <TableRow key={b.id} className="cursor-pointer" onClick={() => router.push(`/batch/${b.id}`)}>
                      <TableCell className="text-sm font-mono">{b.batch_code}</TableCell>
                      <TableCell className="text-sm">{b.name}</TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString("vi-VN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Trang trại
            </CardTitle>
          </CardHeader>
          <CardContent>
            {farmLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {farms.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <span>{f.name}</span>
                    <span className="text-muted-foreground">{f.address}</span>
                  </div>
                ))}
                {farms.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Chưa có trang trại</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
