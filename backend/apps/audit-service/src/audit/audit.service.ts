import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Anchor } from '../entities/anchor.entity';
import { Role } from '@app/shared';
import { HashChainService, ChainPayload, ZERO_HASH } from './hash-chain.service';

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
  ) {}

  // ── WriteLog ────────────────────────────────────────────────
  // Single-writer guarantee via Postgres advisory lock so prev_hash → record_hash chain
  // never forks under concurrent requests.
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
}
