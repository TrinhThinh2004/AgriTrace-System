"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useBatch, useTransitionBatch } from "@/hooks/use-batches";
import { useFarms } from "@/hooks/use-farms";
import { useCropCategories } from "@/hooks/use-crop-categories";
import {
  useActivityLogsByBatch,
  useCreateActivityLog,
  useDeleteActivityLog,
  useSignActivityLog,
} from "@/hooks/use-activity-logs";
import {
  useInspectionsByBatch,
  useCreateInspection,
  useDeleteInspection,
  useSignInspection,
} from "@/hooks/use-inspections";
import { useUserKeys } from "@/hooks/use-keys";
import { useAuthStore } from "@/stores/auth-store";
import {
  importPrivateKey,
  signData,
  getPrivateKey,
  storePrivateKey,
  buildActivityLogCanonical,
  buildInspectionCanonical,
  readPemFile,
} from "@/lib/crypto";
import { TimelineStep } from "@/components/TimelineStep";
import { StatusBadge } from "@/components/StatusBadge";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Leaf,
  Sprout,
  Package,
  ShieldCheck,
  Truck,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  PenLine,
  FileText,
  FlaskConical,
  Eye,
  Award,
  KeyRound,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

const steps = [
  { title: "Gieo trồng", description: "Giống cây, ngày trồng", icon: Sprout },
  { title: "Chăm sóc", description: "Phân bón, thuốc BVTV", icon: Leaf },
  { title: "Thu hoạch", description: "Ngày, sản lượng thực tế", icon: Package },
  { title: "Kiểm định", description: "Kiểm tra chất lượng", icon: ShieldCheck },
  { title: "Đóng gói", description: "Thông tin đóng gói", icon: CheckCircle },
  { title: "Xuất kho", description: "Vận chuyển & mã QR", icon: Truck },
];

const STATUS_ORDER: Record<string, number> = {
  SEEDING: 1, GROWING: 2, HARVESTED: 3, INSPECTED: 4, PACKED: 5, SHIPPED: 6,
};

const NEXT_STATUS: Record<string, { value: string; label: string } | null> = {
  SEEDING: { value: "GROWING", label: "Đang phát triển" },
  GROWING: { value: "HARVESTED", label: "Đã thu hoạch" },
  HARVESTED: { value: "INSPECTED", label: "Đã kiểm định" },
  INSPECTED: { value: "PACKED", label: "Đã đóng gói" },
  PACKED: { value: "SHIPPED", label: "Đã xuất kho" },
  SHIPPED: null,
};

const ACTIVITY_TYPES = [
  { value: "SEEDING", label: "Gieo trồng" },
  { value: "FERTILIZING", label: "Bón phân" },
  { value: "SPRAYING", label: "Phun thuốc" },
  { value: "WATERING", label: "Tưới nước" },
  { value: "PRUNING", label: "Cắt tỉa" },
  { value: "HARVESTING", label: "Thu hoạch" },
  { value: "PACKING", label: "Đóng gói" },
  { value: "OTHER", label: "Khác" },
];

const INSPECTION_TYPES = [
  { value: "FIELD_VISIT", label: "Kiểm tra thực địa", icon: Eye },
  { value: "LAB_TEST", label: "Xét nghiệm", icon: FlaskConical },
  { value: "DOCUMENT_REVIEW", label: "Kiểm tra hồ sơ", icon: FileText },
  { value: "FINAL_CERTIFICATION", label: "Chứng nhận cuối", icon: Award },
];

const INSPECTION_RESULTS = [
  { value: "PENDING", label: "Đang chờ", color: "bg-yellow-100 text-yellow-800" },
  { value: "PASS", label: "Đạt", color: "bg-green-100 text-green-800" },
  { value: "FAIL", label: "Không đạt", color: "bg-red-100 text-red-800" },
  { value: "CONDITIONAL_PASS", label: "Đạt có điều kiện", color: "bg-blue-100 text-blue-800" },
];

function getActivityLabel(type: string) {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label || type;
}

function getInspectionTypeLabel(type: string) {
  return INSPECTION_TYPES.find((t) => t.value === type)?.label || type;
}

function getResultBadge(result: string) {
  const r = INSPECTION_RESULTS.find((x) => x.value === result);
  if (!r) return <Badge variant="outline">{result}</Badge>;
  return <Badge className={r.color}>{r.label}</Badge>;
}

function formatDate(d: string | undefined | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN");
}

export default function BatchDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isFarmer = user?.role === "FARMER";
  const isInspector = user?.role === "INSPECTOR";
  const isAdmin = user?.role === "ADMIN";

  const { data: batch, isLoading } = useBatch(id);
  const { data: farmData } = useFarms();
  const { data: cropData } = useCropCategories();
  const { data: logsData, isLoading: logsLoading } = useActivityLogsByBatch(id);
  const { data: insData, isLoading: insLoading } = useInspectionsByBatch(id);
  const transitionBatch = useTransitionBatch();

  const nextStatus = batch ? NEXT_STATUS[batch.status] : null;

  const handleTransition = async () => {
    if (!nextStatus || !id) return;
    // Inspector performing INSPECTED transition → open dialog instead of window.prompt
    if (isInspector && nextStatus.value === 'INSPECTED') {
      setInspectionResultValue("PASS");
      setInspectionResultDialogOpen(true);
      return;
    }
    // If we're transitioning to HARVESTED, open a dialog to collect date/quantity
    if (nextStatus.value === 'HARVESTED') {
      setHarvestForm({
        actual_harvest_date: batch?.actual_harvest_date ? batch.actual_harvest_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        harvested_quantity: batch?.harvested_quantity ?? "",
      });
      setHarvestDialogOpen(true);
      return;
    }
    try {
      const body: any = { next_status: nextStatus.value as any };
      await transitionBatch.mutateAsync({ id, body });
      toast.success(`Chuyển trạng thái thành công → ${nextStatus.label}`);
    } catch (e: any) {
      toast.error("Lỗi chuyển trạng thái", { description: e.message });
    }
  };

  const handleInspectionConfirm = async () => {
    if (!nextStatus || !id) return;
    try {
      await transitionBatch.mutateAsync({
        id,
        body: { next_status: nextStatus.value as any, inspection_result: inspectionResultValue },
      });
      toast.success(`Chuyển trạng thái thành công → ${nextStatus.label}`);
      setInspectionResultDialogOpen(false);
    } catch (e: any) {
      toast.error("Lỗi chuyển trạng thái", { description: e.message });
    }
  };

  const handleHarvestConfirm = async () => {
    if (!id) return;
    try {
      if (!harvestForm.actual_harvest_date || !harvestForm.harvested_quantity) {
        toast.error("Vui lòng nhập ngày thu hoạch và sản lượng");
        return;
      }
      await transitionBatch.mutateAsync({
        id,
        body: {
          next_status: "HARVESTED",
          actual_harvest_date: new Date(harvestForm.actual_harvest_date).toISOString(),
          harvested_quantity: String(harvestForm.harvested_quantity),
        },
      });
      toast.success("Chuyển trạng thái thành công → Đã thu hoạch");
      setHarvestDialogOpen(false);
    } catch (e: any) {
      toast.error("Lỗi chuyển trạng thái", { description: e.message });
    }
  };

  // Activity Log mutations
  const createLog = useCreateActivityLog();
  const deleteLog = useDeleteActivityLog();
  const signLog = useSignActivityLog();

  // Inspection mutations
  const createInspection = useCreateInspection();
  const deleteInspection = useDeleteInspection();
  const signInspection = useSignInspection();

  // User keys
  const { data: keysData } = useUserKeys();
  const activeKey = keysData?.keys?.find((k) => k.is_active);

  // Dialog states
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [insDialogOpen, setInsDialogOpen] = useState(false);
  const [inspectionResultDialogOpen, setInspectionResultDialogOpen] = useState(false);
  const [inspectionResultValue, setInspectionResultValue] = useState("PASS");
  const [harvestDialogOpen, setHarvestDialogOpen] = useState(false);
  const [harvestForm, setHarvestForm] = useState({ actual_harvest_date: "", harvested_quantity: "" });

  // Sign dialog state
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signTarget, setSignTarget] = useState<{ type: "log" | "inspection"; id: string } | null>(null);
  const [signing, setSigning] = useState(false);
  const pemFileRef = useRef<HTMLInputElement>(null);

  // Activity log form
  const [logForm, setLogForm] = useState({
    activity_type: "FERTILIZING",
    performed_at: new Date().toISOString().slice(0, 10),
    location: "",
    notes: "",
    input_name: "",
    input_quantity: "",
    input_unit: "",
  });

  // Inspection form
  const [insForm, setInsForm] = useState({
    inspection_type: "FIELD_VISIT",
    result: "PENDING",
    scheduled_at: new Date().toISOString().slice(0, 10),
    conducted_at: "",
    notes: "",
    report_url: "",
  });

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
  // STATUS_ORDER maps status to the step that is already DONE.
  // Advance by 1 so the completed step renders as "completed" and the next step renders as "current".
  const currentStep = (STATUS_ORDER[batch.status] ?? 0) + 1;
  const activityLogs = logsData?.logs ?? [];
  const inspections = insData?.inspections ?? [];

  const handleCreateLog = async () => {
    if (!id) return;
    try {
      await createLog.mutateAsync({
        batchId: id,
        body: {
          activity_type: logForm.activity_type,
          performed_at: new Date(logForm.performed_at).toISOString(),
          location: logForm.location || undefined,
          notes: logForm.notes || undefined,
          inputs_used:
            logForm.input_name
              ? [{ name: logForm.input_name, quantity: logForm.input_quantity, unit: logForm.input_unit }]
              : undefined,
        },
      });
      toast.success("Tạo nhật ký thành công");
      setLogDialogOpen(false);
      setLogForm({
        activity_type: "FERTILIZING",
        performed_at: new Date().toISOString().slice(0, 10),
        location: "",
        notes: "",
        input_name: "",
        input_quantity: "",
        input_unit: "",
      });
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  const openSignDialog = (type: "log" | "inspection", id: string) => {
    if (!activeKey) {
      toast.error("Chưa có khóa số", { description: "Vui lòng tạo khóa số trong phần Cài đặt trước khi ký" });
      return;
    }
    setSignTarget({ type, id });
    setSignDialogOpen(true);
  };

  const handleSignWithPem = async (file: File) => {
    if (!signTarget || !activeKey) return;
    setSigning(true);
    try {
      const pem = await readPemFile(file);
      const cryptoKey = await importPrivateKey(pem);

      // Lưu vào IndexedDB để lần sau không cần upload lại
      await storePrivateKey(activeKey.key_id, cryptoKey);

      await performSign(cryptoKey);
    } catch (e: any) {
      toast.error("Lỗi ký", { description: e.message });
    } finally {
      setSigning(false);
    }
  };

  const handleSignWithStoredKey = async () => {
    if (!signTarget || !activeKey) return;
    setSigning(true);
    try {
      const cryptoKey = await getPrivateKey(activeKey.key_id);
      if (!cryptoKey) {
        toast.error("Không tìm thấy khóa trong trình duyệt", { description: "Vui lòng upload file .pem" });
        setSigning(false);
        return;
      }
      await performSign(cryptoKey);
    } catch (e: any) {
      toast.error("Lỗi ký", { description: e.message });
    } finally {
      setSigning(false);
    }
  };

  const performSign = async (cryptoKey: CryptoKey) => {
    if (!signTarget || !activeKey) return;

    if (signTarget.type === "log") {
      const log = activityLogs.find((l) => l.id === signTarget.id);
      if (!log) throw new Error("Không tìm thấy nhật ký");
      const canonical = buildActivityLogCanonical(log);
      const signature = await signData(cryptoKey, canonical);
      await signLog.mutateAsync({
        id: signTarget.id,
        body: {
          digital_signature: signature,
          signed_at: new Date().toISOString(),
          signer_key_id: activeKey.key_id,
        },
      });
      toast.success("Đã ký nhật ký thành công");
    } else {
      const ins = inspections.find((i) => i.id === signTarget.id);
      if (!ins) throw new Error("Không tìm thấy kiểm định");
      const canonical = buildInspectionCanonical(ins);
      const signature = await signData(cryptoKey, canonical);
      await signInspection.mutateAsync({
        id: signTarget.id,
        body: {
          digital_signature: signature,
          signed_at: new Date().toISOString(),
          signer_key_id: activeKey.key_id,
        },
      });
      toast.success("Đã ký kiểm định thành công");
    }
    setSignDialogOpen(false);
    setSignTarget(null);
  };

  const handleSignLog = (logId: string) => {
    openSignDialog("log", logId);
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteLog.mutateAsync(logId);
      toast.success("Đã xóa nhật ký");
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  const handleCreateInspection = async () => {
    if (!id) return;
    try {
      await createInspection.mutateAsync({
        batchId: id,
        body: {
          inspection_type: insForm.inspection_type,
          result: insForm.result || undefined,
          scheduled_at: insForm.scheduled_at ? new Date(insForm.scheduled_at).toISOString() : undefined,
          conducted_at: insForm.conducted_at ? new Date(insForm.conducted_at).toISOString() : undefined,
          notes: insForm.notes || undefined,
          report_url: insForm.report_url || undefined,
        },
      });
      toast.success("Tạo kiểm định thành công");
      setInsDialogOpen(false);
      setInsForm({
        inspection_type: "FIELD_VISIT",
        result: "PENDING",
        scheduled_at: new Date().toISOString().slice(0, 10),
        conducted_at: "",
        notes: "",
        report_url: "",
      });
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  const handleSignInspection = (insId: string) => {
    openSignDialog("inspection", insId);
  };

  const handleDeleteInspection = async (insId: string) => {
    try {
      await deleteInspection.mutateAsync(insId);
      toast.success("Đã xóa kiểm định");
    } catch (e: any) {
      toast.error("Lỗi", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono">{batch.batch_code}</h1>
            <StatusBadge status={batch.status} />
          </div>
          <p className="text-sm text-muted-foreground">{batch.name} &middot; {farm?.name ?? "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Timeline sidebar */}
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

        {/* Tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="logs">Nhật ký</TabsTrigger>
              <TabsTrigger value="inspections">Kiểm định</TabsTrigger>
              <TabsTrigger value="harvest">Thu hoạch</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
            </TabsList>

            {/* ─── Tab: Tổng quan ─── */}
            <TabsContent value="overview">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Loại cây trồng</Label><Input value={crop?.name ?? ""} readOnly /></div>
                    <div><Label>Ngày trồng</Label><Input value={formatDate(batch.planting_date)} readOnly /></div>
                    <div><Label>Trang trại</Label><Input value={farm?.name ?? ""} readOnly /></div>
                    <div><Label>Đơn vị</Label><Input value={batch.unit} readOnly /></div>
                    <div><Label>Ngày dự kiến thu hoạch</Label><Input value={formatDate(batch.expected_harvest_date)} readOnly /></div>
                    <div><Label>Trạng thái</Label><Input value={batch.status} readOnly /></div>
                  </div>
                  {batch.notes && (
                    <div>
                      <Label>Ghi chú</Label>
                      <p className="text-sm text-muted-foreground mt-1">{batch.notes}</p>
                    </div>
                  )}
                  {nextStatus && (() => {
                    const canTransition = (() => {
                      if (!nextStatus) return false;
                      if (isAdmin) return true;
                      if (isFarmer) {
                        return (
                          (batch.status === 'SEEDING' && nextStatus.value === 'GROWING') ||
                          (batch.status === 'GROWING' && nextStatus.value === 'HARVESTED')
                        );
                      }
                      if (isInspector) {
                        return batch.status === 'HARVESTED' && nextStatus.value === 'INSPECTED';
                      }
                      return false;
                    })();
                    return canTransition && (isFarmer || isInspector || isAdmin) ? (
                      <div className="pt-2 border-t">
                        <Button
                          className="w-full"
                          onClick={handleTransition}
                          disabled={transitionBatch.isPending}
                        >
                          {transitionBatch.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Chuyển sang: {nextStatus.label}
                        </Button>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab: Nhật ký canh tác ─── */}
            <TabsContent value="logs">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Nhật ký canh tác ({activityLogs.length})</CardTitle>
                  {(isFarmer || isAdmin) && (
                    <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Thêm nhật ký</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Thêm nhật ký canh tác</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Loại hoạt động</Label>
                            <Select value={logForm.activity_type} onValueChange={(v) => setLogForm((p) => ({ ...p, activity_type: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ACTIVITY_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Ngày thực hiện</Label>
                            <Input type="date" value={logForm.performed_at} onChange={(e) => setLogForm((p) => ({ ...p, performed_at: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Khu vực</Label>
                            <Select value={logForm.location} onValueChange={(v) => setLogForm((p) => ({ ...p, location: v }))}>
                              <SelectTrigger><SelectValue placeholder="Chọn khu vực" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Ruộng A">Ruộng A</SelectItem>
                                <SelectItem value="Ruộng B">Ruộng B</SelectItem>
                                <SelectItem value="Ruộng C">Ruộng C</SelectItem>
                                <SelectItem value="Nhà kho">Nhà kho</SelectItem>
                                <SelectItem value="Nhà đóng gói">Nhà đóng gói</SelectItem>
                                <SelectItem value="Vườn ươm">Vườn ươm</SelectItem>
                                <SelectItem value="Toàn trang trại">Toàn trang trại</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label>Vật tư</Label>
                              <Input value={logForm.input_name} onChange={(e) => setLogForm((p) => ({ ...p, input_name: e.target.value }))} placeholder="Tên" />
                            </div>
                            <div>
                              <Label>Số lượng</Label>
                              <Input value={logForm.input_quantity} onChange={(e) => setLogForm((p) => ({ ...p, input_quantity: e.target.value }))} placeholder="10" />
                            </div>
                            <div>
                              <Label>Đơn vị</Label>
                              <Input value={logForm.input_unit} onChange={(e) => setLogForm((p) => ({ ...p, input_unit: e.target.value }))} placeholder="kg" />
                            </div>
                          </div>
                          <div>
                            <Label>Ghi chú</Label>
                            <Textarea value={logForm.notes} onChange={(e) => setLogForm((p) => ({ ...p, notes: e.target.value }))} rows={3} />
                          </div>
                          <Button className="w-full" onClick={handleCreateLog} disabled={createLog.isPending}>
                            {createLog.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Tạo nhật ký
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : activityLogs.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Chưa có nhật ký canh tác nào</p>
                  ) : (
                    <div className="space-y-3">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{getActivityLabel(log.activity_type)}</Badge>
                              <span className="text-sm text-muted-foreground">{formatDate(log.performed_at)}</span>
                              {log.is_signed && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Đã ký
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {(isFarmer || isAdmin) && !log.is_signed && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleSignLog(log.id)}>
                                    <PenLine className="h-3 w-3 mr-1" /> Ký
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteLog(log.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {log.location && <p className="text-sm"><span className="font-medium">Địa điểm:</span> {log.location}</p>}
                          {log.notes && <p className="text-sm text-muted-foreground">{log.notes}</p>}
                          {log.inputs_used && log.inputs_used.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Vật tư:</span>{" "}
                              {log.inputs_used.map((inp, i) => (
                                <span key={i} className="inline-block mr-2">
                                  {inp.name} ({inp.quantity} {inp.unit})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab: Kiểm định ─── */}
            <TabsContent value="inspections">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Kiểm định ({inspections.length})</CardTitle>
                  {((isInspector && batch.status === 'HARVESTED') || isAdmin) && (
                    <Dialog open={insDialogOpen} onOpenChange={setInsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Tạo kiểm định</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tạo kiểm định mới</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Loại kiểm định</Label>
                            <Select value={insForm.inspection_type} onValueChange={(v) => setInsForm((p) => ({ ...p, inspection_type: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {INSPECTION_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Kết quả</Label>
                            <Select value={insForm.result} onValueChange={(v) => setInsForm((p) => ({ ...p, result: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {INSPECTION_RESULTS.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Ngày lên kế hoạch</Label>
                              <Input type="date" value={insForm.scheduled_at} onChange={(e) => setInsForm((p) => ({ ...p, scheduled_at: e.target.value }))} />
                            </div>
                            <div>
                              <Label>Ngày thực hiện</Label>
                              <Input type="date" value={insForm.conducted_at} onChange={(e) => setInsForm((p) => ({ ...p, conducted_at: e.target.value }))} />
                            </div>
                          </div>
                          <div>
                            <Label>Ghi chú</Label>
                            <Textarea value={insForm.notes} onChange={(e) => setInsForm((p) => ({ ...p, notes: e.target.value }))} rows={3} />
                          </div>
                          <div>
                            <Label>URL báo cáo</Label>
                            <Input value={insForm.report_url} onChange={(e) => setInsForm((p) => ({ ...p, report_url: e.target.value }))} placeholder="https://..." />
                          </div>
                          <Button className="w-full" onClick={handleCreateInspection} disabled={createInspection.isPending}>
                            {createInspection.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Tạo kiểm định
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {insLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : inspections.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Chưa có kiểm định nào</p>
                  ) : (
                    <div className="space-y-3">
                      {inspections.map((ins) => (
                        <div key={ins.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{getInspectionTypeLabel(ins.inspection_type)}</Badge>
                              {getResultBadge(ins.result)}
                              {ins.conducted_at && <span className="text-sm text-muted-foreground">{formatDate(ins.conducted_at)}</span>}
                              {ins.is_signed && (
                                <Badge className="bg-green-100 text-green-800">
                                  <ShieldCheck className="h-3 w-3 mr-1" /> Đã ký
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {(isInspector || isAdmin) && !ins.is_signed && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleSignInspection(ins.id)}>
                                    <PenLine className="h-3 w-3 mr-1" /> Ký
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteInspection(ins.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {ins.notes && <p className="text-sm text-muted-foreground">{ins.notes}</p>}
                          {ins.report_url && (
                            <p className="text-sm">
                              <span className="font-medium">Báo cáo:</span>{" "}
                              <a href={ins.report_url} target="_blank" rel="noreferrer" className="text-primary underline">{ins.report_url}</a>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab: Thu hoạch ─── */}
            <TabsContent value="harvest">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Ngày thu hoạch</Label><Input type="date" defaultValue={batch.actual_harvest_date ?? ""} readOnly={!isFarmer && !isAdmin} /></div>
                    <div><Label>Sản lượng ({batch.unit})</Label><Input defaultValue={batch.harvested_quantity ?? ""} readOnly={!isFarmer && !isAdmin} /></div>
                    <div><Label>Ngày dự kiến</Label><Input value={formatDate(batch.expected_harvest_date)} readOnly /></div>
                    <div><Label>Sản lượng xuất</Label><Input defaultValue={batch.shipped_quantity ?? ""} readOnly={!isFarmer && !isAdmin} /></div>
                  </div>
                  {batch.notes && <Textarea value={batch.notes} readOnly rows={3} />}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab: QR Code ─── */}
            <TabsContent value="qr">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Mã lô</Label><Input value={batch.batch_code} readOnly /></div>
                    <div><Label>Trạng thái</Label><Input value={batch.status} readOnly /></div>
                  </div>
                  <div className="flex justify-center py-4">
                    <QRCodeDisplay code={batch.batch_code} size={200} downloadable />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Quét mã QR để xem hành trình sản phẩm tại trang truy xuất công khai
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog thu hoạch */}
      <Dialog open={harvestDialogOpen} onOpenChange={(open) => setHarvestDialogOpen(open)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thu hoạch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ngày thu hoạch</Label>
              <Input
                type="date"
                value={harvestForm.actual_harvest_date}
                onChange={(e) => setHarvestForm((p) => ({ ...p, actual_harvest_date: e.target.value }))}
                readOnly={!isFarmer && !isAdmin}
              />
            </div>
            <div>
              <Label>Sản lượng ({batch.unit})</Label>
              <Input
                type="number"
                value={harvestForm.harvested_quantity}
                onChange={(e) => setHarvestForm((p) => ({ ...p, harvested_quantity: e.target.value }))}
                readOnly={!isFarmer && !isAdmin}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setHarvestDialogOpen(false)}>Huỷ</Button>
              <Button onClick={handleHarvestConfirm}>Xác nhận</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog ký số RSA */}
      <Dialog open={signDialogOpen} onOpenChange={(open) => { if (!signing) { setSignDialogOpen(open); if (!open) setSignTarget(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Ký số {signTarget?.type === "log" ? "nhật ký" : "kiểm định"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Key ID: <code className="text-xs">{activeKey?.key_id?.slice(0, 8)}...</code>
            </p>

            <input
              ref={pemFileRef}
              type="file"
              accept=".pem"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSignWithPem(file);
                e.target.value = "";
              }}
            />

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSignWithStoredKey}
                disabled={signing}
              >
                {signing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                Ký bằng khóa đã lưu
              </Button>

              <Button
                variant="outline"
                onClick={() => pemFileRef.current?.click()}
                disabled={signing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload file .pem
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Nếu chưa lưu khóa trong trình duyệt, hãy upload file .pem được tải về khi tạo khóa.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chọn kết quả kiểm định (thay window.prompt) */}
      <Dialog open={inspectionResultDialogOpen} onOpenChange={setInspectionResultDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kết quả kiểm định</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chọn kết quả</Label>
              <Select value={inspectionResultValue} onValueChange={setInspectionResultValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSPECTION_RESULTS.filter((r) => r.value !== "PENDING").map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setInspectionResultDialogOpen(false)}>
                Hủy
              </Button>
              <Button className="flex-1" onClick={handleInspectionConfirm} disabled={transitionBatch.isPending}>
                {transitionBatch.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Xác nhận
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
