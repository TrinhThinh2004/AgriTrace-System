"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { useFarms } from "@/hooks/use-farms";
import { useState } from "react";

const certLabel: Record<string, string> = {
  NONE: "Chưa có",
  PENDING: "Đang chờ",
  VIETGAP: "VietGAP",
  GLOBALGAP: "GlobalGAP",
  ORGANIC: "Hữu cơ",
};

export default function FarmsManagement() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useFarms();

  const farms = data?.items ?? [];
  const filtered = farms.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.address ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý trang trại</h1>
          <p className="text-sm text-muted-foreground">Quản lý các trang trại đã đăng ký</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Thêm trang trại
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm trang trại..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Diện tích</TableHead>
                  <TableHead>Chứng nhận</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.address}</TableCell>
                    <TableCell className="text-sm">{f.area_hectares ? `${f.area_hectares} ha` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {certLabel[f.certification_status] ?? f.certification_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                        {f.status === "ACTIVE" ? "Hoạt động" : "Ngưng"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy trang trại
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
