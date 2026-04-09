import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function SignaturePanel() {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleAction = (action: "approve" | "reject") => {
    toast({
      title: action === "approve" ? "Đã phê duyệt lô hàng" : "Đã từ chối lô hàng",
      description: `Hoàn thành với ghi chú: ${notes || "Không có ghi chú"}`,
    });
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
        <Textarea
          placeholder="Thêm ghi chú kiểm định..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => handleAction("approve")}>
            <CheckCircle className="h-4 w-4 mr-2" /> Phê duyệt & Ký
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => handleAction("reject")}>
            <XCircle className="h-4 w-4 mr-2" /> Từ chối
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
