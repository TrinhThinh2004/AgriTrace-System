"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  KeyRound,
  Plus,
  Trash2,
  Download,
  HardDrive,
  Loader2,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useUserKeys,
  useGenerateKeyPair,
  useRevokeKey,
} from "@/hooks/use-keys";
import {
  importPrivateKey,
  storePrivateKey,
  downloadPemFile,
  hasStoredKey,
} from "@/lib/crypto";
import { useEffect, useMemo } from "react";

function formatDate(d: string | undefined | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsPage() {
  const { data: keysData, isLoading } = useUserKeys();
  const generateKey = useGenerateKeyPair();
  const revokeKey = useRevokeKey();

  // Generate dialog
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [genResult, setGenResult] = useState<{
    key_id: string;
    public_key: string;
    private_key: string;
    algorithm: string;
  } | null>(null);
  const [pemDownloaded, setPemDownloaded] = useState(false);
  const [savedToIndexedDB, setSavedToIndexedDB] = useState(false);
  const [saving, setSaving] = useState(false);

  // Revoke dialog
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  // Track which keys are stored in IndexedDB
  const [storedKeyIds, setStoredKeyIds] = useState<Set<string>>(new Set());
  const keys = useMemo(() => keysData?.keys ?? [], [keysData?.keys]);
  const keyIdsKey = keys.map((k) => k.key_id).join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = new Set<string>();
      for (const k of keys) {
        if (await hasStoredKey(k.key_id)) ids.add(k.key_id);
      }
      if (!cancelled) setStoredKeyIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [keyIdsKey]);

  const handleGenerate = async () => {
    try {
      const result = await generateKey.mutateAsync();
      setGenResult(result);
      setPemDownloaded(false);
      setSavedToIndexedDB(false);
      setGenDialogOpen(true);
    } catch (e: any) {
      toast.error("Lỗi tạo khóa", { description: e.message });
    }
  };

  const handleDownloadPem = () => {
    if (!genResult) return;
    downloadPemFile(
      genResult.private_key,
      `agritrace-key-${genResult.key_id.slice(0, 8)}.pem`,
    );
    setPemDownloaded(true);
    toast.success("Đã tải file .pem");
  };

  const handleSaveToIndexedDB = async () => {
    if (!genResult) return;
    setSaving(true);
    try {
      const cryptoKey = await importPrivateKey(genResult.private_key);
      await storePrivateKey(genResult.key_id, cryptoKey);
      setSavedToIndexedDB(true);
      setStoredKeyIds((prev) => new Set(prev).add(genResult.key_id));
      toast.success("Đã lưu khóa vào trình duyệt");
    } catch (e: any) {
      toast.error("Lỗi lưu khóa", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeKey.mutateAsync(revokeTarget);
      toast.success("Đã thu hồi khóa");
      setRevokeTarget(null);
    } catch (e: any) {
      toast.error("Lỗi thu hồi", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Quản lý khóa số</h1>
        <p className="text-sm text-muted-foreground">
          Tạo và quản lý cặp khóa RSA-SHA256 để ký số nhật ký canh tác và kiểm định
        </p>
      </div>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">Lưu ý quan trọng về khóa số</p>
              <ul className="list-disc ml-4 space-y-0.5 text-blue-700">
                <li>Private key <strong>chỉ hiển thị 1 lần</strong> khi tạo. Hãy tải về và lưu an toàn.</li>
                <li>Server <strong>không bao giờ lưu</strong> private key.</li>
                <li>Nếu mất private key, bạn phải thu hồi khóa cũ và tạo khóa mới.</li>
                <li>Mỗi tài khoản chỉ có 1 khóa active tại 1 thời điểm.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keys table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Danh sách khóa
          </CardTitle>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generateKey.isPending}
          >
            {generateKey.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Tạo khóa mới
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <KeyRound className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Chưa có khóa số nào</p>
              <p className="text-sm text-muted-foreground">
                Tạo khóa để bắt đầu ký số nhật ký và kiểm định
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key ID</TableHead>
                  <TableHead>Thuật toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Lưu trình duyệt</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.key_id}>
                    <TableCell className="font-mono text-xs">
                      {key.key_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{key.algorithm}</Badge>
                    </TableCell>
                    <TableCell>
                      {key.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <ShieldOff className="h-3 w-3 mr-1" /> Revoked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {storedKeyIds.has(key.key_id) ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" /> Đã lưu
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Chưa lưu</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate((key as any).created_at)}
                    </TableCell>
                    <TableCell>
                      {key.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRevokeTarget(key.key_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Generate result dialog */}
      <Dialog
        open={genDialogOpen}
        onOpenChange={(open) => {
          if (!open && !pemDownloaded) {
            toast.warning("Hãy tải file .pem trước khi đóng!");
            return;
          }
          setGenDialogOpen(open);
          if (!open) setGenResult(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Khóa số đã được tạo
            </DialogTitle>
          </DialogHeader>
          {genResult && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Private key chỉ hiển thị 1 lần duy nhất!
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Hãy tải file .pem và lưu vào trình duyệt ngay bây giờ.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Key ID</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">
                  {genResult.key_id}
                </code>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">
                  Public Key <Badge variant="outline" className="ml-1">{genResult.algorithm}</Badge>
                </p>
                <Textarea
                  value={genResult.public_key}
                  readOnly
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={handleDownloadPem} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  {pemDownloaded ? "Tải lại file .pem" : "Tải private key (.pem)"}
                  {pemDownloaded && <CheckCircle className="h-4 w-4 ml-2 text-green-300" />}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSaveToIndexedDB}
                  disabled={saving || savedToIndexedDB}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <HardDrive className="h-4 w-4 mr-2" />
                  )}
                  {savedToIndexedDB
                    ? "Đã lưu vào trình duyệt"
                    : "Lưu vào trình duyệt (IndexedDB)"}
                  {savedToIndexedDB && <CheckCircle className="h-4 w-4 ml-2 text-green-600" />}
                </Button>
              </div>

              {pemDownloaded && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setGenDialogOpen(false);
                    setGenResult(null);
                  }}
                >
                  Đóng
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke confirm dialog */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thu hồi khóa số?</AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi thu hồi, khóa này không thể dùng để ký nữa. Các chữ ký đã tạo trước đó vẫn hợp lệ.
              Bạn sẽ cần tạo khóa mới để tiếp tục ký.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeKey.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Thu hồi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
