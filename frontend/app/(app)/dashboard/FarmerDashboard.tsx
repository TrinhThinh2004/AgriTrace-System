"use client";
import { BatchCard } from "@/components/BatchCard";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, CheckCircle, Clock, Plus, Search } from "lucide-react";
import { mockBatches } from "@/lib/mockData";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function FarmerDashboard() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const filtered = mockBatches.filter(b => {
    if (filter !== "all" && b.status !== filter) return false;
    if (search && !b.batchCode.toLowerCase().includes(search.toLowerCase()) && !b.cropVariety.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trang nông dân</h1>
          <p className="text-sm text-muted-foreground">Quản lý các lô sản xuất</p>
        </div>
        <Button onClick={() => toast({ title: "Tạo lô hàng", description: "Mở biểu mẫu tạo lô hàng mới" })}>
          <Plus className="h-4 w-4 mr-1" /> Tạo lô mới
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Tổng lô hàng" value={mockBatches.length} icon={<Package className="h-5 w-5" />} />
        <StatsCard title="Đạt chuẩn" value={mockBatches.filter(b => b.status === "certified").length} icon={<CheckCircle className="h-5 w-5" />} />
        <StatsCard title="Đang xử lý" value={mockBatches.filter(b => b.status === "in_progress").length} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm lô hàng..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="draft">Nháp</SelectItem>
            <SelectItem value="in_progress">Đang xử lý</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="certified">Đạt chuẩn</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(batch => (
          <BatchCard key={batch.id} batch={batch} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Không tìm thấy lô hàng phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}
