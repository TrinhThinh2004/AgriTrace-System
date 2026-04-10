"use client";
import { BatchCard } from "@/components/BatchCard";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, CheckCircle, Clock, Plus, Search, Loader2 } from "lucide-react";
import { useBatches } from "@/hooks/use-batches";
import { useFarms } from "@/hooks/use-farms";
import { useState } from "react";
import { useRouter } from "next/navigation";

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "SEEDING", label: "Gieo trồng" },
  { value: "GROWING", label: "Đang phát triển" },
  { value: "HARVESTED", label: "Đã thu hoạch" },
  { value: "INSPECTED", label: "Đã kiểm định" },
  { value: "PACKED", label: "Đã đóng gói" },
  { value: "SHIPPED", label: "Đã xuất kho" },
];

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
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Tạo lô mới
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Tổng lô hàng" value={batches.length} icon={<Package className="h-5 w-5" />} />
        <StatsCard title="Đã xuất kho" value={batches.filter((b) => b.status === "SHIPPED").length} icon={<CheckCircle className="h-5 w-5" />} />
        <StatsCard title="Đang xử lý" value={batches.filter((b) => b.status === "GROWING" || b.status === "SEEDING").length} icon={<Clock className="h-5 w-5" />} />
      </div>

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

      {isLoading ? (
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
