"use client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Loader2, ClipboardList, Plus, Pencil } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useFarms } from "@/hooks/use-farms";
import { useUsers } from "@/hooks/use-users";
import { useCertTemplates } from "@/hooks/use-certification";
import { certificationApi } from "@/lib/api/certification";
import type { Farm } from "@/lib/api/product";
import type { CertificationTemplate } from "@/lib/api/certification";
import {
  CreateTemplateDialog,
  EditTemplateDialog,
} from "@/components/CertTemplateDialog";

const certTypeLabel: Record<string, string> = {
  VIETGAP: "VietGAP",
  GLOBALGAP: "GlobalGAP",
  ORGANIC: "Hữu cơ",
};

export default function StandardsApprovalQueue() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Chứng nhận tiêu chuẩn
          </h1>
          <p className="text-sm text-muted-foreground">
            Duyệt hồ sơ checklist VietGAP / GlobalGAP / Hữu cơ và quản lý template
          </p>
        </div>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Hàng đợi duyệt</TabsTrigger>
          <TabsTrigger value="templates">Template chứng nhận</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <ApprovalQueueTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApprovalQueueTab() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [openingFarmId, setOpeningFarmId] = useState<string | null>(null);

  const { data, isLoading } = useFarms({
    certification_status: "PENDING",
    limit: 100,
  });
  const { data: usersData } = useUsers({ limit: 100 });

  const userMap = useMemo(
    () => new Map((usersData?.items ?? []).map((u) => [u.id, u.full_name])),
    [usersData],
  );

  const farms = data?.items ?? [];
  const filtered = farms.filter((f) => {
    if (
      typeFilter !== "ALL" &&
      f.requested_certification_type !== typeFilter
    ) {
      return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.address ?? "").toLowerCase().includes(q)
    );
  });

  const openChecklist = async (farm: Farm) => {
    setOpeningFarmId(farm.id);
    try {
      const latest = await certificationApi.getLatestByFarm(farm.id);
      if (!latest) {
        toast.error("Farm chưa gửi checklist", {
          description:
            "Yêu cầu farmer hoàn tất checklist trước khi admin có thể duyệt.",
        });
        return;
      }
      if (latest.status !== "SUBMITTED") {
        toast.info(
          `Checklist hiện đang ở trạng thái ${latest.status} — đang mở chi tiết.`,
        );
      }
      router.push(`/standards/${latest.id}`);
    } catch (e: any) {
      toast.error("Không tải được checklist", { description: e.message });
    } finally {
      setOpeningFarmId(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tên trang trại..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Loại chứng nhận" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại</SelectItem>
            <SelectItem value="VIETGAP">VietGAP</SelectItem>
            <SelectItem value="GLOBALGAP">GlobalGAP</SelectItem>
            <SelectItem value="ORGANIC">Hữu cơ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="mt-4">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trang trại</TableHead>
                  <TableHead>Chủ sở hữu</TableHead>
                  <TableHead>Loại xin</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {f.address || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {userMap.get(f.owner_id) ?? "—"}
                    </TableCell>
                    <TableCell>
                      {f.requested_certification_type ? (
                        <Badge variant="secondary" className="text-xs">
                          {certTypeLabel[f.requested_certification_type] ??
                            f.requested_certification_type}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          Chưa chỉ định
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {f.updated_at
                        ? new Date(f.updated_at).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={openingFarmId === f.id}
                          onClick={() => openChecklist(f)}
                        >
                          {openingFarmId === f.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Eye className="h-3 w-3 mr-1" />
                          )}
                          Xem checklist
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Không có yêu cầu nào đang chờ duyệt
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function TemplatesTab() {
  const { data, isLoading } = useCertTemplates({ limit: 50 });
  const templates = data?.items ?? [];
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CertificationTemplate | null>(null);

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Tạo template
        </Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Chưa có template nào — bấm "Tạo template" để bắt đầu.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Mã</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Số tiêu chí</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                        {t.name}
                      </div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {certTypeLabel[t.cert_type] ?? t.cert_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.items.length}</TableCell>
                    <TableCell>
                      {t.active ? (
                        <Badge className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(t)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditTemplateDialog
        template={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
      />
    </>
  );
}
