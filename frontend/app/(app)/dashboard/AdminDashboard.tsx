"use client";
import { useMemo } from "react";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Building2, ClipboardCheck, QrCode, Plus, MapPin, Loader2 } from "lucide-react";
import { useBatches } from "@/hooks/use-batches";
import { useFarms } from "@/hooks/use-farms";
import { useRouter } from "next/navigation";
import { CountBarChart } from "@/components/charts/CountBarChart";
import { DistributionPieChart } from "@/components/charts/DistributionPieChart";
import { aggregateByMonth, aggregateByField } from "@/components/charts/aggregate";

const BATCH_STATUS_LABELS: Record<string, string> = {
  SEEDING: "Gieo trồng",
  GROWING: "Đang phát triển",
  HARVESTED: "Đã thu hoạch",
  INSPECTED: "Đã kiểm định",
  PACKED: "Đã đóng gói",
  SHIPPED: "Đã xuất kho",
};
const BATCH_STATUS_COLORS: Record<string, string> = {
  SEEDING: "#a3e635", GROWING: "#22c55e", HARVESTED: "#eab308",
  INSPECTED: "#3b82f6", PACKED: "#a855f7", SHIPPED: "#0ea5e9",
};
const CERT_LABELS: Record<string, string> = {
  NONE: "Chưa có", PENDING: "Đang chờ", VIETGAP: "VietGAP", GLOBALGAP: "GlobalGAP", ORGANIC: "Hữu cơ",
};
const CERT_COLORS: Record<string, string> = {
  NONE: "#cbd5e1", PENDING: "#fbbf24", VIETGAP: "#22c55e", GLOBALGAP: "#3b82f6", ORGANIC: "#a855f7",
};

export default function AdminDashboard() {
  const router = useRouter();
  const { data: batchData, isLoading: batchLoading } = useBatches();
  const { data: farmData, isLoading: farmLoading } = useFarms();

  const batches = batchData?.items ?? [];
  const farms = farmData?.items ?? [];
  const isLoading = batchLoading || farmLoading;

  const certifiedFarms = farms.filter((f) => f.certification_status !== "NONE");

  const batchesByMonth = useMemo(() => aggregateByMonth(batches, (b) => b.created_at, 6), [batches]);
  const batchStatusDist = useMemo(
    () => aggregateByField(batches, (b) => b.status, BATCH_STATUS_LABELS, BATCH_STATUS_COLORS),
    [batches],
  );
  const certDist = useMemo(
    () => aggregateByField(farms, (f) => f.certification_status, CERT_LABELS, CERT_COLORS),
    [farms],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Trang quản trị</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hoạt động AgriTrace</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            <CardTitle className="text-base">Lô hàng tạo mới theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <CountBarChart data={batchesByMonth} color="#22c55e" barName="Số lô" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố trạng thái lô</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionPieChart data={batchStatusDist} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chứng nhận trang trại</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            <DistributionPieChart data={certDist} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lô hàng gần đây</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
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
