"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { mockFarms } from "@/lib/mockData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FarmsManagement() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const filtered = mockFarms.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý trang trại</h1>
          <p className="text-sm text-muted-foreground">Quản lý các trang trại đã đăng ký</p>
        </div>
        <Button onClick={() => toast({ title: "Thêm trang trại", description: "Mở biểu mẫu tạo trang trại" })}>
          <Plus className="h-4 w-4 mr-1" /> Thêm trang trại
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm trang trại..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Chủ sở hữu</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Diện tích</TableHead>
                <TableHead>Tiêu chuẩn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-sm">{f.owner}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.location}</TableCell>
                  <TableCell className="text-sm">{f.area}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{f.standard}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={f.certified ? "default" : "secondary"} className="text-xs">
                      {f.certified ? "Đạt chuẩn" : "Chờ duyệt"}
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
