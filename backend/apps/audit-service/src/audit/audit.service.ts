import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Anchor } from '../entities/anchor.entity';
import { Role } from '@app/shared';
import { HashChainService, ChainPayload, ZERO_HASH } from './hash-chain.service';
import { MerkleService } from '../anchor/merkle.service';
import { BlockchainService } from '../anchor/blockchain.service';

// ngẫu nhiên chọn một khóa số nguyên 64-bit làm advisory lock key để đảm bảo single-writer cho bảng audit
// Bất kì chương trình ghi audit log nào cũng phải acquire khóa này trước khi ghi.
const CHAIN_LOCK_KEY = 1095649868; // 0x41475254 ("AGRT")

export interface WriteLogInput {
  actor_id?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  before_data?: Record<string, any> | null;
  after_data?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  occurred_at?: string;
}

export interface ListLogsFilter {
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(AuditLog) private readonly logRepo: Repository<AuditLog>,
    @InjectRepository(Anchor) private readonly anchorRepo: Repository<Anchor>,
    private readonly hashChain: HashChainService,
    private readonly merkle: MerkleService,
    private readonly blockchain: BlockchainService,
  ) {}

  // ── WriteLog ────────────────────────────────────────────────
  // Đảm bảo tính toàn vẹn của chuỗi hash bằng cách acquire advisory lock trước khi ghi log mới.
  async writeLog(input: WriteLogInput): Promise<AuditLog> {
    if (!input.action) throw new BadRequestException('action is required');
    if (!input.entity_type) throw new BadRequestException('entity_type is required');

    return this.dataSource.transaction(async (mgr) => {
      // Lock auto-released at COMMIT/ROLLBACK
      await mgr.query('SELECT pg_advisory_xact_lock($1)', [CHAIN_LOCK_KEY]);

      const last = await mgr
        .createQueryBuilder(AuditLog, 'a')
        .orderBy('a.seq_no', 'DESC')
        .limit(1)
        .getOne();

      const prev_hash = last?.record_hash ?? ZERO_HASH;
      const occurred_at = input.occurred_at ?? new Date().toISOString();

      const payload: ChainPayload = {
        actor_id: input.actor_id ?? null,
        actor_role: input.actor_role ?? null,
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id ?? null,
        before_data: input.before_data ?? null,
        after_data: input.after_data ?? null,
        metadata: input.metadata ?? null,
        occurred_at,
      };
      const record_hash = this.hashChain.computeRecordHash(prev_hash, payload);

      const log = mgr.create(AuditLog, {
        actor_id: payload.actor_id,
        actor_role: (payload.actor_role as Role) ?? null,
        action: payload.action,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        before_data: payload.before_data,
        after_data: payload.after_data,
        metadata: { ...(payload.metadata ?? {}), occurred_at },
        prev_hash,
        record_hash,
      });
      return mgr.save(log);
    });
  }

  // ── Read ────────────────────────────────────────────────────
  async getLogs(filter: ListLogsFilter) {
    const page = Math.max(1, Number(filter.page ?? 1));
    const limit = Math.min(200, Math.max(1, Number(filter.limit ?? 50)));

    const where: FindOptionsWhere<AuditLog> = {};
    if (filter.entity_type) where.entity_type = filter.entity_type;
    if (filter.entity_id) where.entity_id = filter.entity_id;
    if (filter.actor_id) where.actor_id = filter.actor_id;
    if (filter.action) where.action = filter.action;
    if (filter.date_from && filter.date_to) {
      where.created_at = Between(new Date(filter.date_from), new Date(filter.date_to));
    }

    const [items, total] = await this.logRepo.findAndCount({
      where,
      order: { seq_no: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async getLogBySeq(seqNo: string): Promise<AuditLog> {
    const log = await this.logRepo.findOne({ where: { seq_no: seqNo } });
    if (!log) throw new NotFoundException(`audit log seq_no=${seqNo} not found`);
    return log;
  }

  // ── Anchors ─────────────────────────────────────────────────
  async listAnchors(page = 1, limit = 50) {
    const p = Math.max(1, Number(page));
    const l = Math.min(200, Math.max(1, Number(limit)));
    const [items, total] = await this.anchorRepo.findAndCount({
      order: { anchored_at: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { items, pagination: { page: p, limit: l, total } };
  }

  async getAnchor(id: string): Promise<Anchor> {
    const a = await this.anchorRepo.findOne({ where: { id } });
    if (!a) throw new NotFoundException(`anchor ${id} not found`);
    return a;
  }

  // ── VerifyLog ───────────────────────────────────────────────
  // Verify log bằng cách:
  // 1. Recompute record_hash từ payload và prev_hash, so sánh với record_hash đã lưu
  // 2. Nếu log đã được anchor, rebuild Merkle tree từ tất cả logs trong dải [from_seq, to_seq], lấy Merkle proof cho log này, và verify proof đó
  // 3. Nếu blockchain đã init, lấy Merkle root trên chain và so sánh với root trong DB
  async verifyLog(seqNo: string): Promise<VerifyLogResult> {
    const log = await this.logRepo.findOne({ where: { seq_no: seqNo } });
    if (!log) throw new NotFoundException(`audit log seq_no=${seqNo} not found`);

    // 1. Recompute record_hash và verify hash chain
    const occurredAt =
      (log.metadata as any)?.occurred_at ?? log.created_at?.toISOString();
    const payload: ChainPayload = {
      actor_id: log.actor_id,
      actor_role: log.actor_role,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      before_data: log.before_data,
      after_data: log.after_data,
      // Loại bỏ field occurred_at khỏi metadata để rebuild ChainPayload đúng. 
      metadata: this.stripOccurredAt(log.metadata),
      occurred_at: occurredAt,
    };
    const recomputedHash = this.hashChain.computeRecordHash(log.prev_hash, payload);
    const hashChainValid = recomputedHash === log.record_hash;

    // 2. Nếu log đã được anchor, rebuild Merkle tree từ tất cả logs trong dải [from_seq, to_seq],
    //  lấy Merkle proof cho log này, và verify proof đó
    let anchor: Anchor | null = null;
    let merkleProof: string[] = [];
    let merkleProofValid = false;
    let onchainMerkleRoot = '';
    let onchainRootMatch = false;

    if (log.anchor_id) {
      anchor = await this.anchorRepo.findOne({ where: { id: log.anchor_id } });

      if (anchor) {
        // Rebuild Merkle tree từ tất cả logs trong dải [from_seq, to_seq]
        const peerLogs = await this.logRepo.find({
          where: {
            seq_no: Between(anchor.from_seq, anchor.to_seq),
          },
          order: { seq_no: 'ASC' },
          select: ['seq_no', 'record_hash'],
        });
        const recordHashes = peerLogs.map((l) => l.record_hash);
        const { root, tree } = this.merkle.buildTree(recordHashes);

        merkleProof = this.merkle.getProof(tree, log.record_hash);
        merkleProofValid = this.merkle.verifyProof(
          root,
          log.record_hash,
          merkleProof,
        );

        // 3. On-chain root match 
        if (this.blockchain.isReady()) {
          try {
            const onchain = await this.blockchain.getAnchorOnchain(
              BigInt(anchor.onchain_anchor_id),
            );
            onchainMerkleRoot = onchain.merkleRoot;
            onchainRootMatch =
              onchainMerkleRoot.toLowerCase() ===
              anchor.merkle_root.toLowerCase();
          } catch {
            // RPC fail → giữ default empty + false
          }
        }
      }
    }

    // prev_log để FE hiển thị link "Xem record trước"
    const prevLog = await this.logRepo.findOne({
      where: { seq_no: LessThan(log.seq_no) },
      order: { seq_no: 'DESC' },
      select: ['seq_no', 'record_hash'],
    });

    return {
      log,
      recomputed_hash: recomputedHash,
      hash_chain_valid: hashChainValid,
      prev_record_hash: prevLog?.record_hash ?? ZERO_HASH,
      anchor,
      anchor_present: !!anchor,
      merkle_proof: merkleProof,
      merkle_proof_valid: merkleProofValid,
      onchain_merkle_root: onchainMerkleRoot,
      onchain_root_match: onchainRootMatch,
    };
  }

  // Loại bỏ field occurred_at khỏi metadata để rebuild ChainPayload đúng.
  private stripOccurredAt(metadata: Record<string, any> | null) {
    if (!metadata) return null;
    const { occurred_at: _ignored, ...rest } = metadata;
    return Object.keys(rest).length > 0 ? rest : null;
  }
}

export interface VerifyLogResult {
  log: AuditLog;
  recomputed_hash: string;
  hash_chain_valid: boolean;
  prev_record_hash: string;
  anchor: Anchor | null;
  anchor_present: boolean;
  merkle_proof: string[];
  merkle_proof_valid: boolean;
  onchain_merkle_root: string;
  onchain_root_match: boolean;
}
