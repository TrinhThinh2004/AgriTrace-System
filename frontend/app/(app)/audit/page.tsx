"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Loader2,
  Anchor as AnchorIcon,
  Clock,
  ExternalLink,
  Eye,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuditLogs, useTriggerAnchor } from "@/hooks/use-audit-logs";
import { useUsers } from "@/hooks/use-users";
import { txExplorerUrl } from "@/lib/blockchain";
import type { AuditLog } from "@/lib/api/audit";

const ENTITY_TYPES = [
  "User",
  "JwtKey",
  "UserKey",
  "Farm",
  "CropCategory",
  "Batch",
  "ActivityLog",
  "Inspection",
  "Media",
];

const ACTIONS = [
  "USER_REGISTERED",
  "USER_LOGIN",
  "USER_LOGOUT",
  "USER_PROFILE_UPDATED",
  "JWT_KEY_ROTATED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_KEY_GENERATED",
  "USER_KEY_REVOKED",
  "FARM_CREATED",
  "FARM_UPDATED",
  "FARM_DELETED",
  "CERT_REQUESTED",
  "CERT_APPROVED",
  "CERT_REJECTED",
  "CROP_CREATED",
  "CROP_UPDATED",
  "CROP_DELETED",
  "BATCH_CREATED",
  "BATCH_UPDATED",
  "BATCH_DELETED",
  "BATCH_STATUS_CHANGED",
  "ACTIVITY_CREATED",
  "ACTIVITY_UPDATED",
  "ACTIVITY_DELETED",
  "ACTIVITY_SIGNED",
  "INSPECTION_CREATED",
  "INSPECTION_UPDATED",
  "INSPECTION_DELETED",
  "INSPECTION_SIGNED",
  "MEDIA_UPLOADED",
  "MEDIA_DELETED",
];

function safeParseJson(s: string): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function shortHash(h: string, n = 8) {
  if (!h) return "";
  return h.length > n * 2 ? `${h.slice(0, n)}…${h.slice(-4)}` : h;
}

export default function AuditLogPage() {
  const [entityType, setEntityType] = useState<string>("ALL");
  const [action, setAction] = useState<string>("ALL");
  const [search, setSearch] = useState(""); // search trong actor_id/entity_id
  const [page, setPage] = useState(1);
  const limit = 50;

  const params = useMemo(
    () => ({
      entity_type: entityType !== "ALL" ? entityType : undefined,
      action: action !== "ALL" ? action : undefined,
      page,
      limit,
    }),
    [entityType, action, page],
  );

  const { data, isLoading } = useAuditLogs(params);
  const { data: usersData } = useUsers({ limit: 200 });
  const trigger = useTriggerAnchor();

  const userMap = useMemo(
    () =>
      new Map(
        (usersData?.items ?? []).map((u) => [u.id, u.full_name]),
      ),
    [usersData],
  );

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Client-side search trong actor_id / entity_id
  const filtered = items.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.actor_id.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const handleTriggerAnchor = async () => {
    try {
      const res = await trigger.mutateAsync();
      if (res.skipped) {
        toast.info("Không có gì để anchor", { description: res.reason });
      } else {
        toast.success(
          `Đã anchor ${res.count} log → block ${res.block_number}`,
          {
            description: `tx: ${shortHash(res.tx_hash, 6)}`,
          },
        );
      }
    } catch (e: any) {
      toast.error("Lỗi anchor", { description: e?.message ?? String(e) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Audit log</h1>
          <p className="text-sm text-muted-foreground">
            Lịch sử mọi thao tác trên hệ thống — bất biến, được anchor lên
            blockchain Sepolia
          </p>
        </div>
        <Button
          onClick={handleTriggerAnchor}
          disabled={trigger.isPending}
          variant="default"
        >
          {trigger.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Anchor ngay
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm actor / entity / action..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Loại entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả entity</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả action</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Seq</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Anchor</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer" onClick={() => setDetailLog(log)}>
                    <TableCell className="font-mono text-xs">#{log.seq_no}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.actor_id ? (
                        <div>
                          <div className="font-medium">{userMap.get(log.actor_id) ?? "—"}</div>
                          <div className="text-xs text-muted-foreground capitalize">{log.actor_role.toLowerCase()}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{log.entity_type}</div>
                      {log.entity_id && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {shortHash(log.entity_id, 6)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.anchor_id ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-xs">
                          <AnchorIcon className="h-3 w-3 mr-1" />
                          Anchored
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setDetailLog(log)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Diff
                        </Button>
                        <Link href={`/audit/${log.seq_no}/verify`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Verify
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Không có log nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} · {total} bản ghi
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      <Dialog open={!!detailLog} onOpenChange={(open) => { if (!open) setDetailLog(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Audit log #{detailLog?.seq_no} — {detailLog?.action}
            </DialogTitle>
          </DialogHeader>
          {detailLog && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Actor</p>
                  <p>{userMap.get(detailLog.actor_id) ?? "—"} <span className="text-xs text-muted-foreground">({detailLog.actor_role})</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Thời gian</p>
                  <p>{detailLog.created_at ? new Date(detailLog.created_at).toLocaleString("vi-VN") : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Entity</p>
                  <p>{detailLog.entity_type} · <span className="font-mono text-xs">{detailLog.entity_id || "—"}</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Anchor status</p>
                  <div>{detailLog.anchor_id ? <Badge className="bg-emerald-600">Anchored</Badge> : <Badge variant="secondary">Pending</Badge>}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold mb-1">Before</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-64">
{JSON.stringify(safeParseJson(detailLog.before_data), null, 2) || "—"}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">After</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-64">
{JSON.stringify(safeParseJson(detailLog.after_data), null, 2) || "—"}
                  </pre>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-1">Metadata</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-32">
{JSON.stringify(safeParseJson(detailLog.metadata), null, 2) || "—"}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <p className="text-muted-foreground">Prev hash</p>
                  <p className="break-all">{detailLog.prev_hash}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Record hash</p>
                  <p className="break-all">{detailLog.record_hash}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href={`/audit/${detailLog.seq_no}/verify`}>
                  <Button>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Verify cryptographic proof
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
