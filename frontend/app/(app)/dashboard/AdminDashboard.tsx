"use client";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Building2, ClipboardCheck, QrCode, Plus, MapPin } from "lucide-react";
import { mockBatches, mockActivities, mockFarms } from "@/lib/mockData";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

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
            <Plus className="h-4 w-4 mr-1" /> Thêm giống cây
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Tổng lô hàng" value={mockBatches.length} icon={<Package className="h-5 w-5" />} trend="+12% tháng này" />
        <StatsCard title="Trang trại đạt chuẩn" value={mockFarms.filter(f => f.certified).length} icon={<Building2 className="h-5 w-5" />} description={`trên tổng ${mockFarms.length}`} />
        <StatsCard title="Chờ kiểm định" value={mockBatches.filter(b => b.status === "completed").length} icon={<ClipboardCheck className="h-5 w-5" />} />
        <StatsCard title="Lượt quét QR hôm nay" value={142} icon={<QrCode className="h-5 w-5" />} trend="+8% so với hôm qua" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockActivities.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{a.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.user}</TableCell>
                    <TableCell className="text-sm font-mono">{a.target}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Trang trại theo vùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Bản đồ trực quan</p>
                <p className="text-xs">Sắp ra mắt</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {["Lam Dong", "Ninh Thuan", "Buon Ma Thuot", "Can Tho"].map((r, i) => (
                <div key={r} className="flex items-center justify-between text-sm">
                  <span>{r}</span>
                  <span className="text-muted-foreground">{[2, 1, 1, 1][i]} trang trại</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
