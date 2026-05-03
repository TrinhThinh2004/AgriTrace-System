import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuditService } from './audit.service';
import { AuditLog } from '../entities/audit-log.entity';
import { Anchor } from '../entities/anchor.entity';

interface WriteLogRpcRequest {
  actor_id?: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_data?: string; // JSON string
  after_data?: string;  // JSON string
  metadata?: string;    // JSON string
  occurred_at?: string;
}

interface GetLogsRpcRequest {
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

function parseJson(s: string | undefined | null): Record<string, any> | null {
  if (!s) return null;
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function logToRpc(log: AuditLog) {
  return {
    id: log.id,
    seq_no: String(log.seq_no),
    actor_id: log.actor_id ?? '',
    actor_role: log.actor_role ?? '',
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id ?? '',
    before_data: log.before_data ? JSON.stringify(log.before_data) : '',
    after_data: log.after_data ? JSON.stringify(log.after_data) : '',
    metadata: log.metadata ? JSON.stringify(log.metadata) : '',
    prev_hash: log.prev_hash,
    record_hash: log.record_hash,
    anchor_id: log.anchor_id ?? '',
    created_at: log.created_at?.toISOString() ?? '',
  };
}

function anchorToRpc(a: Anchor) {
  return {
    id: a.id,
    merkle_root: a.merkle_root,
    from_seq: String(a.from_seq),
    to_seq: String(a.to_seq),
    tx_hash: a.tx_hash,
    block_number: String(a.block_number),
    chain_id: a.chain_id,
    onchain_anchor_id: String(a.onchain_anchor_id),
    anchored_at: a.anchored_at?.toISOString() ?? '',
  };
}

@Controller()
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @GrpcMethod('AuditService', 'WriteLog')
  async writeLog(req: WriteLogRpcRequest) {
    const log = await this.service.writeLog({
      actor_id: req.actor_id || null,
      actor_role: req.actor_role || null,
      action: req.action,
      entity_type: req.entity_type,
      entity_id: req.entity_id || null,
      before_data: parseJson(req.before_data),
      after_data: parseJson(req.after_data),
      metadata: parseJson(req.metadata),
      occurred_at: req.occurred_at,
    });
    return logToRpc(log);
  }

  @GrpcMethod('AuditService', 'GetLogs')
  async getLogs(req: GetLogsRpcRequest) {
    const { items, pagination } = await this.service.getLogs(req);
    return { items: items.map(logToRpc), pagination };
  }

  @GrpcMethod('AuditService', 'GetLogBySeq')
  async getLogBySeq(req: { seq_no: string }) {
    const log = await this.service.getLogBySeq(req.seq_no);
    return logToRpc(log);
  }

  @GrpcMethod('AuditService', 'VerifyLog')
  async verifyLog(req: { seq_no: string }) {
    // Phase 5 will replace this stub with full chain + Merkle + on-chain verification.
    const log = await this.service.getLogBySeq(req.seq_no);
    return {
      log: logToRpc(log),
      recomputed_hash: '',
      hash_chain_valid: false,
      prev_record_hash: '',
      anchor: anchorToRpc({} as Anchor),
      anchor_present: false,
      merkle_proof_valid: false,
      onchain_merkle_root: '',
      onchain_root_match: false,
      merkle_proof: [],
    };
  }

  @GrpcMethod('AuditService', 'ListAnchors')
  async listAnchors(req: { page?: number; limit?: number }) {
    const { items, pagination } = await this.service.listAnchors(req.page, req.limit);
    return { items: items.map(anchorToRpc), pagination };
  }

  @GrpcMethod('AuditService', 'GetAnchor')
  async getAnchor(req: { id: string }) {
    const a = await this.service.getAnchor(req.id);
    return anchorToRpc(a);
  }
}
