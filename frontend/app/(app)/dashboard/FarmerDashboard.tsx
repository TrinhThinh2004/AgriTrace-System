"use client";
import { BatchCard } from "@/components/BatchCard";
import { StatsCard } from "@/components/StatsCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, CheckCircle, Clock, Search, Loader2, MapPin, Building2, ArrowRight } from "lucide-react";
import { useBatches } from "@/hooks/use-batches";
import { useFarms } from "@/hooks/use-farms";
import { CreateBatchDialog } from "@/components/CreateBatchDialog";
import { CreateFarmDialog } from "@/components/CreateFarmDialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "SEEDING", label: "Gieo trồng" },
  { value: "GROWING", label: "Đang phát triển" },
  { value: "HARVESTED", label: "Đã thu hoạch" },
  { value: "INSPECTED", label: "Đã kiểm định" },
  { value: "PACKED", label: "Đã đóng gói" },
  { value: "SHIPPED", label: "Đã xuất kho" },
];
  
const certLabel: Record<string, string> = {
  NONE: "Chưa có",
  PENDING: "Đang chờ",
  VIETGAP: "VietGAP",
  GLOBALGAP: "GlobalGAP",
  ORGANIC: "Hữu cơ",
};

export default function FarmerDashboard() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const { data: batchData, isLoading } = useBatches();
  const { data: farmData } = useFarms();

  const batches = batchData?.items ?? [];
  const farms = farmData?.items ?? [];

  const filtered = batches.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (
      search &&
      !b.batch_code.toLowerCase().includes(search.toLowerCase()) &&
      !b.name.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trang nông dân</h1>
          <p className="text-sm text-muted-foreground">Quản lý các lô sản xuất</p>
        </div>
        <CreateBatchDialog />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Tổng lô hàng" value={batches.length} icon={<Package className="h-5 w-5" />} />
        <StatsCard title="Đã xuất kho" value={batches.filter((b) => b.status === "SHIPPED").length} icon={<CheckCircle className="h-5 w-5" />} />
        <StatsCard title="Đang xử lý" value={batches.filter((b) => b.status === "GROWING" || b.status === "SEEDING").length} icon={<Clock className="h-5 w-5" />} />
      </div>

      {/* Danh sách trang trại */}
      {farms.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              <Building2 className="h-4 w-4 inline mr-2" />
              Trang trại của tôi ({farms.length})
            </CardTitle>
            <div className="flex gap-2">
              <CreateFarmDialog />
              <Button variant="outline" size="sm" onClick={() => router.push("/farms")}>
                Xem tất cả <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {farms.map((farm) => (
                <div
                  key={farm.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push("/farms")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{farm.name}</p>
                    <Badge variant={farm.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                      {farm.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                    </Badge>
                  </div>
                  {farm.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {farm.address}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {farm.area_hectares && (
                      <span className="text-xs text-muted-foreground">{farm.area_hectares} ha</span>
                    )}
                    {farm.certification_status && farm.certification_status !== "NONE" && (
                      <Badge variant="outline" className="text-xs">
                        {certLabel[farm.certification_status] ?? farm.certification_status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm lô hàng..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {farms.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <MapPin className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="font-medium">Bạn chưa có trang trại nào</p>
              <p className="text-sm text-muted-foreground">Tạo trang trại trước để bắt đầu quản lý lô hàng</p>
            </div>
            <CreateFarmDialog />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((batch) => {
            const farm = farms.find((f) => f.id === batch.farm_id);
            return <BatchCard key={batch.id} batch={batch} farmName={farm?.name} />;
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Không tìm thấy lô hàng phù hợp.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
