"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useCreateInspection, useSignInspection } from "@/hooks/use-inspections";
import { useUserKeys } from "@/hooks/use-keys";
import {
  importPrivateKey,
  signData,
  getPrivateKey,
  storePrivateKey,
  buildInspectionCanonical,
  readPemFile,
} from "@/lib/crypto";

interface SignaturePanelProps {
  batchId?: string;
}

export function SignaturePanel({ batchId }: SignaturePanelProps) {
  const [notes, setNotes] = useState("");
  const [inspectionType, setInspectionType] = useState("FIELD_VISIT");
  const createInspection = useCreateInspection();
  const signInspection = useSignInspection();
  const { data: keysData } = useUserKeys();
  const activeKey = keysData?.keys?.find((k) => k.is_active);

  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const pemFileRef = useRef<HTMLInputElement>(null);

  const isProcessing = createInspection.isPending || signInspection.isPending || !!pendingAction;

  const doSign = async (action: "approve" | "reject", cryptoKey: CryptoKey) => {
    if (!batchId || !activeKey) return;

    try {
      const inspection = await createInspection.mutateAsync({
        batchId,
        body: {
          inspection_type: inspectionType,
          result: action === "approve" ? "PASS" : "FAIL",
          conducted_at: new Date().toISOString(),
          notes: notes || undefined,
        },
      });

      const canonical = buildInspectionCanonical(inspection);
      const signature = await signData(cryptoKey, canonical);

      await signInspection.mutateAsync({
        id: inspection.id,
        body: {
          digital_signature: signature,
          signed_at: new Date().toISOString(),
          signer_key_id: activeKey.key_id,
        },
      });

      toast.success(
        action === "approve" ? "Đã phê duyệt lô hàng" : "Đã từ chối lô hàng",
        { description: "Kiểm định đã được tạo và ký số RSA-SHA256" },
      );
      setNotes("");
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    } finally {
      setPendingAction(null);
    }
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (!batchId) {
      toast.error("Vui lòng chọn lô hàng");
      return;
    }
    if (!activeKey) {
      toast.error("Chưa có khóa số", { description: "Vui lòng tạo khóa số trước khi ký" });
      return;
    }

    setPendingAction(action);

    // Thử dùng key đã lưu trong IndexedDB
    const storedKey = await getPrivateKey(activeKey.key_id);
    if (storedKey) {
      await doSign(action, storedKey);
    } else {
      // Yêu cầu upload PEM
      toast.info("Vui lòng upload file .pem để ký");
      pemFileRef.current?.click();
    }
  };

  const handlePemUpload = async (file: File) => {
    if (!pendingAction || !activeKey) return;
    try {
      const pem = await readPemFile(file);
      const cryptoKey = await importPrivateKey(pem);
      await storePrivateKey(activeKey.key_id, cryptoKey);
      await doSign(pendingAction, cryptoKey);
    } catch (e: any) {
      toast.error("Lỗi đọc file PEM", { description: e.message });
      setPendingAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Bảng chữ ký số
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeKey ? (
          <p className="text-xs text-muted-foreground">
            <KeyRound className="inline h-3 w-3 mr-1" />
            Key: <code>{activeKey.key_id.slice(0, 8)}...</code> ({activeKey.algorithm})
          </p>
        ) : (
          <p className="text-xs text-amber-600">
            Chưa có khóa số. Vui lòng tạo khóa trong phần quản lý tài khoản.
          </p>
        )}
        <div>
          <Label>Loại kiểm định</Label>
          <Select value={inspectionType} onValueChange={setInspectionType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FIELD_VISIT">Kiểm tra thực địa</SelectItem>
              <SelectItem value="LAB_TEST">Xét nghiệm</SelectItem>
              <SelectItem value="DOCUMENT_REVIEW">Kiểm tra hồ sơ</SelectItem>
              <SelectItem value="FINAL_CERTIFICATION">Chứng nhận cuối</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Thêm ghi chú kiểm định..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <input
          ref={pemFileRef}
          type="file"
          accept=".pem"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePemUpload(file);
            e.target.value = "";
          }}
        />

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => handleAction("approve")} disabled={isProcessing || !activeKey}>
            {isProcessing && pendingAction === "approve" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Phê duyệt & Ký
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => handleAction("reject")} disabled={isProcessing || !activeKey}>
            {isProcessing && pendingAction === "reject" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
            Từ chối
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
