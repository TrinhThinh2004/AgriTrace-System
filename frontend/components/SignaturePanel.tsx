"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateInspection, useSignInspection } from "@/hooks/use-inspections";

interface SignaturePanelProps {
  batchId?: string;
}

export function SignaturePanel({ batchId }: SignaturePanelProps) {
  const [notes, setNotes] = useState("");
  const [inspectionType, setInspectionType] = useState("FIELD_VISIT");
  const user = useAuthStore((s) => s.user);

  const createInspection = useCreateInspection();
  const signInspection = useSignInspection();

  const isProcessing = createInspection.isPending || signInspection.isPending;

  const handleAction = async (action: "approve" | "reject") => {
    if (!batchId) {
      toast.error("Vui lòng chọn lô hàng");
      return;
    }

    try {
      // Tạo inspection với kết quả PASS hoặc FAIL
      const inspection = await createInspection.mutateAsync({
        batchId,
        body: {
          inspection_type: inspectionType,
          result: action === "approve" ? "PASS" : "FAIL",
          conducted_at: new Date().toISOString(),
          notes: notes || undefined,
        },
      });

      // Tự động ký inspection vừa tạo
      await signInspection.mutateAsync({
        id: inspection.id,
        body: {
          digital_signature: btoa(`inspector-${user?.id}-${action}-${Date.now()}`),
          signed_at: new Date().toISOString(),
        },
      });

      toast.success(
        action === "approve" ? "Đã phê duyệt lô hàng" : "Đã từ chối lô hàng",
        { description: "Kiểm định đã được tạo và ký số" },
      );
      setNotes("");
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
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
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => handleAction("approve")} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Phê duyệt & Ký
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => handleAction("reject")} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
            Từ chối
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
