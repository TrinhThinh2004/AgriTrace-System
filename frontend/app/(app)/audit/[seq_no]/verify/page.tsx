"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Hash,
  Network,
} from "lucide-react";
import { useVerifyAuditLog } from "@/hooks/use-audit-logs";
import {
  txExplorerUrl,
  blockExplorerUrl,
  BLOCKCHAIN_CONFIG,
} from "@/lib/blockchain";

function StatusBadge({ ok, label, pending }: { ok: boolean; label: string; pending?: boolean }) {
  if (pending) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  }
  return ok ? (
    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-xs">
      <Check className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  ) : (
    <Badge variant="destructive" className="text-xs">
      <X className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

export default function VerifyAuditLogPage() {
  const router = useRouter();
  const params = useParams<{ seq_no: string }>();
  const seqNo = params?.seq_no;

  const { data, isLoading, error } = useVerifyAuditLog(seqNo);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="p-6 text-destructive">
            Lỗi tải log: {(error as Error)?.message ?? "không tìm thấy"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    log,
    anchor,
    anchor_present = false,
    hash_chain_valid = false,
    recomputed_hash = "",
    prev_record_hash = "",
    merkle_proof = [],
    merkle_proof_valid = false,
    onchain_merkle_root = "",
    onchain_root_match = false,
  } = data;

  const overallOk =
    hash_chain_valid && (!anchor_present || (merkle_proof_valid && onchain_root_match));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Verify audit log #{log.seq_no}
          </h1>
          <p className="text-sm text-muted-foreground">
            Kiểm tra mật mã: hash chain integrity + Merkle proof + on-chain anchor
          </p>
        </div>
        <div>
          {overallOk ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              <Check className="h-4 w-4 mr-1" />
              Toàn vẹn
            </Badge>
          ) : (
            <Badge variant="destructive">
              <X className="h-4 w-4 mr-1" />
              Không khớp
            </Badge>
          )}
        </div>
      </div>

      {/* Section 1 — Record info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Field label="Action" value={<Badge variant="outline" className="font-mono">{log.action}</Badge>} />
            <Field label="Entity" value={`${log.entity_type} · ${log.entity_id || "—"}`} />
            <Field label="Actor" value={`${log.actor_id || "—"} (${log.actor_role || "—"})`} />
            <Field label="Thời gian" value={log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "—"} />
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Hash chain integrity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Lớp 1 — Hash chain integrity (off-chain)
            </CardTitle>
            <StatusBadge ok={hash_chain_valid} label={hash_chain_valid ? "Khớp" : "Không khớp"} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tính lại <code className="bg-muted px-1 py-0.5 rounded">record_hash = sha256(prev_hash || canonical(payload))</code> và so với giá trị đang lưu trong DB.
          </p>
          <div className="space-y-2 font-mono text-xs">
            <HashRow label="prev_hash" value={log.prev_hash} hint={`Hash của log #${(BigInt(log.seq_no) - BigInt(1)).toString()} (đã verify ở turn trước)`} />
            <HashRow label="record_hash (DB)" value={log.record_hash} />
            <HashRow
              label="recomputed_hash"
              value={recomputed_hash}
              ok={hash_chain_valid}
              hint={hash_chain_valid ? "Khớp với giá trị trong DB" : "KHÔNG khớp — log đã bị tampering"}
            />
          </div>
          {prev_record_hash !== "0".repeat(64) && (
            <div className="text-xs text-muted-foreground">
              Prev record hash từ DB: <code className="font-mono">{prev_record_hash}</code> {prev_record_hash === log.prev_hash ? "✓" : "✗ MISMATCH"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3 — On-chain anchor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="h-4 w-4" />
              Lớp 2 — On-chain anchor ({BLOCKCHAIN_CONFIG.CHAIN_NAME})
            </CardTitle>
            {!anchor_present ? (
              <StatusBadge ok={false} pending label="Chưa anchor" />
            ) : (
              <StatusBadge
                ok={merkle_proof_valid && onchain_root_match}
                label={merkle_proof_valid && onchain_root_match ? "Khớp on-chain" : "Không khớp"}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!anchor_present ? (
            <p className="text-sm text-muted-foreground">
              Log này chưa được anchor lên blockchain. Cron worker sẽ anchor vào đầu giờ tiếp theo, hoặc admin có thể bấm <strong>Anchor ngay</strong> trong trang <Link href="/audit" className="text-primary underline">/audit</Link> để chạy thủ công.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <Field label="Anchor on-chain ID" value={`#${anchor.onchain_anchor_id}`} />
                <Field label="Block" value={
                  <a href={blockExplorerUrl(anchor.block_number)} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    {anchor.block_number} <ExternalLink className="h-3 w-3" />
                  </a>
                } />
                <Field label="Tx hash" value={
                  <a href={txExplorerUrl(anchor.tx_hash)} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-xs break-all">
                    {anchor.tx_hash} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                } />
                <Field label="Anchored at" value={anchor.anchored_at ? new Date(anchor.anchored_at).toLocaleString("vi-VN") : "—"} />
                <Field label="Range" value={`seq #${anchor.from_seq} → #${anchor.to_seq}`} />
                <Field label="Chain" value={`${BLOCKCHAIN_CONFIG.CHAIN_NAME} (${anchor.chain_id})`} />
              </div>

              <div className="space-y-2 font-mono text-xs">
                <HashRow
                  label="Merkle root (DB)"
                  value={anchor.merkle_root}
                />
                <HashRow
                  label="Merkle root (on-chain)"
                  value={onchain_merkle_root || "(không đọc được — RPC fail)"}
                  ok={onchain_root_match}
                  hint={onchain_root_match ? "Khớp với DB" : (onchain_merkle_root ? "KHÔNG khớp — anchor đã bị thay đổi" : "RPC blockchain không phản hồi — kiểm tra ANCHOR_RPC_URL")}
                />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span>Merkle proof ({merkle_proof.length} bước):</span>
                <StatusBadge ok={merkle_proof_valid} label={merkle_proof_valid ? "Verified" : "Failed"} />
              </div>
              {merkle_proof.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Xem proof</summary>
                  <pre className="bg-muted p-2 rounded mt-2 overflow-x-auto">
{merkle_proof.map((p, i) => `[${i}] ${p}`).join("\n")}
                  </pre>
                </details>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="wrap-break-word">{value}</p>
    </div>
  );
}

function HashRow({
  label,
  value,
  ok,
  hint,
}: {
  label: string;
  value: string;
  ok?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-32 shrink-0">{label}</span>
        <span className={`break-all ${ok === false ? "text-destructive" : ok === true ? "text-emerald-600" : ""}`}>{value}</span>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground ml-32 pl-2">{hint}</p>}
    </div>
  );
}
