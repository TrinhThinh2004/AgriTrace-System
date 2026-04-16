"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { publicTraceApi } from "@/lib/api/trace";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Leaf,
  Sprout,
  Package,
  Tractor,
  CheckCircle,
  Loader2,
  AlertCircle,
  Droplets,
  Scissors,
  PenLine,
  Box,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, typeof Sprout> = {
  SEEDING: Sprout,
  FERTILIZING: Leaf,
  SPRAYING: Droplets,
  WATERING: Droplets,
  PRUNING: Scissors,
  HARVESTING: Package,
  PACKING: Box,
  OTHER: PenLine,
};

const ACTIVITY_LABELS: Record<string, string> = {
  SEEDING: "Gieo trồng",
  FERTILIZING: "Bón phân",
  SPRAYING: "Phun thuốc",
  WATERING: "Tưới nước",
  PRUNING: "Cắt tỉa",
  HARVESTING: "Thu hoạch",
  PACKING: "Đóng gói",
  OTHER: "Khác",
};

const RESULT_CONFIG: Record<string, { label: string; color: string }> = {
  PASS: { label: "Đạt", color: "bg-green-100 text-green-800" },
  FAIL: { label: "Không đạt", color: "bg-red-100 text-red-800" },
  PENDING: { label: "Đang chờ", color: "bg-yellow-100 text-yellow-800" },
  CONDITIONAL_PASS: { label: "Đạt có điều kiện", color: "bg-blue-100 text-blue-800" },
};

function formatDate(d: string | undefined | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PublicTrace() {
  const { code } = useParams<{ code: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-trace", code],
    queryFn: () => publicTraceApi.getByBatchCode(code!),
    enabled: !!code,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="bg-primary text-primary-foreground py-8 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Tractor className="h-6 w-6" />
              <span className="text-xl font-bold">AgriTrace</span>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Không tìm thấy lô hàng</h2>
          <p className="text-muted-foreground">Mã &quot;{code}&quot; không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

  const { batch, farm, crop, activity_logs, inspections } = data;
  const hasPassingInspection = inspections.some((i) => i.result === "PASS" || i.result === "CONDITIONAL_PASS");

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
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
        {/* Thông tin lô hàng */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono font-bold text-lg">{batch.batch_code}</p>
                <p className="text-base font-semibold">{batch.name}</p>
                {crop && <p className="text-sm text-muted-foreground">{crop.name}</p>}
              </div>
              <QRCodeDisplay code={batch.batch_code} size={80} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {farm && (
                <>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Nông trại</p>
                    <p className="font-medium">{farm.name}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Diện tích</p>
                    <p className="font-medium">{farm.area_hectares ? `${farm.area_hectares} ha` : "—"}</p>
                  </div>
                </>
              )}
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Ngày gieo</p>
                <p className="font-medium">{formatDate(batch.planting_date)}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Ngày thu hoạch</p>
                <p className="font-medium">{formatDate(batch.actual_harvest_date || batch.expected_harvest_date)}</p>
              </div>
              {batch.harvested_quantity && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Sản lượng</p>
                  <p className="font-medium">{batch.harvested_quantity} {batch.unit}</p>
                </div>
              )}
              {farm?.certification_status && farm.certification_status !== "NONE" && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Chứng nhận</p>
                  <p className="font-medium">{farm.certification_status}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline hoạt động */}
        {activity_logs.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">Nhật ký canh tác ({activity_logs.length})</h2>
              <div className="space-y-4">
                {activity_logs.map((log, i) => {
                  const Icon = ACTIVITY_ICONS[log.activity_type] || PenLine;
                  return (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        {i < activity_logs.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{ACTIVITY_LABELS[log.activity_type] || log.activity_type}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(log.performed_at)}</span>
                          {log.is_signed && (
                            <Badge variant="outline" className={log.signer_key_id ? "text-green-700 border-green-400 bg-green-50 text-xs" : "text-green-600 border-green-300 text-xs"}>
                              {log.signer_key_id ? <ShieldCheck className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                              {log.signer_key_id ? "Đã xác thực" : "Đã ký"}
                            </Badge>
                          )}
                        </div>
                        {log.location && <p className="text-xs text-muted-foreground">Địa điểm: {log.location}</p>}
                        {log.notes && <p className="text-sm text-muted-foreground">{log.notes}</p>}
                        {log.inputs_used && log.inputs_used.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {log.inputs_used.map((inp, j) => (
                              <Badge key={j} variant="secondary" className="text-xs">
                                {inp.name}: {inp.quantity} {inp.unit}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kết quả kiểm định */}
        {inspections.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">Kết quả kiểm định ({inspections.length})</h2>
              <div className="space-y-3">
                {inspections.map((ins) => {
                  const rc = RESULT_CONFIG[ins.result];
                  return (
                    <div key={ins.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">
                          {ins.inspection_type === "FIELD_VISIT" && "Kiểm tra thực địa"}
                          {ins.inspection_type === "LAB_TEST" && "Xét nghiệm"}
                          {ins.inspection_type === "DOCUMENT_REVIEW" && "Kiểm tra hồ sơ"}
                          {ins.inspection_type === "FINAL_CERTIFICATION" && "Chứng nhận cuối"}
                        </span>
                        {rc && <Badge className={rc.color}>{rc.label}</Badge>}
                        {ins.conducted_at && <span className="text-xs text-muted-foreground">{formatDate(ins.conducted_at)}</span>}
                        {ins.is_signed && (
                          <Badge variant="outline" className={ins.signer_key_id ? "text-green-700 border-green-400 bg-green-50 text-xs" : "text-green-600 border-green-300 text-xs"}>
                            {ins.signer_key_id ? <ShieldCheck className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                            {ins.signer_key_id ? "Đã xác thực RSA" : "Đã ký"}
                          </Badge>
                        )}
                      </div>
                      {ins.notes && <p className="text-sm text-muted-foreground ml-6">{ins.notes}</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chứng nhận */}
        {hasPassingInspection && (
          <Card className="border-green-300">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-700">Đã xác thực</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sản phẩm này đã được kiểm định và xác thực bởi cơ quan có thẩm quyền
              </p>
              {farm?.certification_status && farm.certification_status !== "NONE" && (
                <Badge className="mt-2 bg-green-100 text-green-800">Đạt chuẩn {farm.certification_status}</Badge>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
