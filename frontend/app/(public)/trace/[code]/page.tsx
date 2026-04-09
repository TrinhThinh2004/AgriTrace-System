"use client";
import { useParams } from "next/navigation";
import { mockBatches } from "@/lib/mockData";
import { TimelineStep } from "@/components/TimelineStep";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Leaf, Sprout, Package, Tractor, CheckCircle } from "lucide-react";

const traceSteps = [
  { title: "Nguồn giống", description: "Giống được chứng nhận", icon: Sprout },
  { title: "Canh tác", description: "Quy trình canh tác đạt chuẩn VietGAP", icon: Tractor },
  { title: "Thu hoạch & Chất lượng", description: "Chất lượng hạng A, bảo quản lạnh 4°C", icon: Leaf },
  { title: "Đóng gói", description: "Đóng gói kín và dán nhãn phân phối", icon: Package },
  { title: "Chứng nhận", description: "Được kiểm tra và xác thực bởi thanh tra", icon: ShieldCheck },
];

export default function PublicTrace() {
  const { code } = useParams();
  const batch = mockBatches.find(b => b.batchCode === code || b.id === code) || mockBatches[0];

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Tractor className="h-6 w-6" />
            <span className="text-xl font-bold">AgriTrace</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Hành trình sản phẩm</h1>
          <p className="text-sm opacity-80">Tra cứu toàn bộ hành trình sản phẩm từ giống đến kệ hàng</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto -mt-4 px-4 pb-12 space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono font-bold">{batch.batchCode}</p>
                <p className="text-lg font-semibold">{batch.cropVariety}</p>
              </div>
              <QRCodeDisplay code={batch.batchCode} size={80} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Nông trại</p>
                <p className="font-medium">{batch.farmName}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Diện tích</p>
                <p className="font-medium">{batch.area}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Ngày gieo</p>
                <p className="font-medium">{batch.plantingDate}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Ngày thu hoạch</p>
                <p className="font-medium">{batch.harvestDate || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Tiến trình sản phẩm</h2>
            {traceSteps.map((s, i) => (
              <TimelineStep
                key={i}
                step={i + 1}
                title={s.title}
                description={s.description}
                status={i + 1 <= batch.currentStep ? "completed" : i + 1 === batch.currentStep + 1 ? "current" : "upcoming"}
                isLast={i === traceSteps.length - 1}
              />
            ))}
          </CardContent>
        </Card>

        {batch.status === "certified" && (
          <Card className="border-success/30">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
              <h3 className="font-semibold text-success">Đã xác thực</h3>
              <p className="text-sm text-muted-foreground mt-1">Sản phẩm này đã được xác thực bởi cơ quan kiểm định có thẩm quyền</p>
              <Badge className="mt-2 bg-success text-success-foreground">Đạt chuẩn VietGAP</Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
