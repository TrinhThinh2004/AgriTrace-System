"use client";
import { useParams, useRouter } from "next/navigation";
import { useBatch } from "@/hooks/use-batches";
import { useFarms } from "@/hooks/use-farms";
import { useCropCategories } from "@/hooks/use-crop-categories";
import { TimelineStep } from "@/components/TimelineStep";
import { StatusBadge } from "@/components/StatusBadge";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Leaf, Sprout, Package, ShieldCheck, Truck, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { title: "Gieo trồng", description: "Giống cây, ngày trồng", icon: Sprout },
  { title: "Chăm sóc", description: "Phân bón, thuốc BVTV - VietGAP", icon: Leaf },
  { title: "Thu hoạch", description: "Ngày, sản lượng thực tế", icon: Package },
  { title: "Kiểm định", description: "Kiểm tra chất lượng", icon: ShieldCheck },
  { title: "Đóng gói", description: "Thông tin đóng gói", icon: CheckCircle },
  { title: "Xuất kho", description: "Vận chuyển & mã QR", icon: Truck },
];

const STATUS_ORDER: Record<string, number> = {
  SEEDING: 1, GROWING: 2, HARVESTED: 3, INSPECTED: 4, PACKED: 5, SHIPPED: 6,
};

const vietGAPChecklist = [
  "Sử dụng phân bón được phê duyệt",
  "Thuốc BVTV trong giới hạn an toàn",
  "Chất lượng nước đã kiểm tra",
  "Phân tích đất hoàn thành",
  "Không sử dụng hóa chất cấm",
  "Tuân thủ quy trình an toàn lao động",
];

export default function BatchDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { toast } = useToast();

  const { data: batch, isLoading } = useBatch(id);
  const { data: farmData } = useFarms();
  const { data: cropData } = useCropCategories();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!batch) return <div className="text-center py-12 text-muted-foreground">Không tìm thấy lô hàng</div>;

  const farm = farmData?.items?.find((f) => f.id === batch.farm_id);
  const crop = cropData?.items?.find((c) => c.id === batch.crop_category_id);
  const currentStep = STATUS_ORDER[batch.status] ?? 1;

  const handleSign = () => {
    toast({ title: "Đã ký & gửi", description: "Dữ liệu bước đã được ký và gửi." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono">{batch.batch_code}</h1>
            <StatusBadge status={batch.status} />
          </div>
          <p className="text-sm text-muted-foreground">{batch.name} · {farm?.name ?? "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Tiến trình</CardTitle></CardHeader>
          <CardContent>
            {steps.map((s, i) => (
              <TimelineStep
                key={i}
                step={i + 1}
                title={s.title}
                description={s.description}
                status={i + 1 < currentStep ? "completed" : i + 1 === currentStep ? "current" : "upcoming"}
                isLast={i === steps.length - 1}
              />
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Tabs defaultValue="step1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="step1">Gieo trồng</TabsTrigger>
              <TabsTrigger value="step2">Chăm sóc</TabsTrigger>
              <TabsTrigger value="step3">Thu hoạch</TabsTrigger>
              <TabsTrigger value="step4">Đóng gói & QR</TabsTrigger>
            </TabsList>

            <TabsContent value="step1">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Loại cây trồng</Label><Input value={crop?.name ?? ""} readOnly /></div>
                    <div><Label>Ngày trồng</Label><Input type="date" defaultValue={batch.planting_date ?? ""} /></div>
                    <div><Label>Trang trại</Label><Input value={farm?.name ?? ""} readOnly /></div>
                    <div><Label>Đơn vị</Label><Input value={batch.unit} readOnly /></div>
                  </div>
                  <Button onClick={handleSign} className="w-full">Ký & gửi bước 1</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="step2">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-medium text-sm">Danh sách kiểm tra VietGAP</h3>
                  <div className="space-y-3">
                    {vietGAPChecklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Checkbox id={`check-${i}`} defaultChecked={i < 4} />
                        <label htmlFor={`check-${i}`} className="text-sm">{item}</label>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Phân bón sử dụng</Label><Input defaultValue="" /></div>
                    <div><Label>Ngày bón</Label><Input type="date" /></div>
                  </div>
                  <Textarea placeholder="Ghi chú chăm sóc thêm..." rows={3} />
                  <Button onClick={handleSign} className="w-full">Ký & gửi bước 2</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="step3">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Ngày thu hoạch</Label><Input type="date" defaultValue={batch.actual_harvest_date ?? ""} /></div>
                    <div><Label>Sản lượng ({batch.unit})</Label><Input defaultValue={batch.harvested_quantity ?? ""} /></div>
                    <div><Label>Ngày dự kiến</Label><Input type="date" value={batch.expected_harvest_date ?? ""} readOnly /></div>
                    <div><Label>Sản lượng xuất</Label><Input defaultValue={batch.shipped_quantity ?? ""} /></div>
                  </div>
                  <Textarea placeholder="Ghi chú thu hoạch..." rows={3} defaultValue={batch.notes ?? ""} />
                  <Button onClick={handleSign} className="w-full">Ký & gửi bước 3</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="step4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Mã lô</Label><Input value={batch.batch_code} readOnly /></div>
                    <div><Label>Trạng thái</Label><Input value={batch.status} readOnly /></div>
                  </div>
                  <div className="flex justify-center py-4">
                    <QRCodeDisplay code={batch.batch_code} size={140} />
                  </div>
                  <Button onClick={handleSign} className="w-full">Ký & gửi bước 4</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
