import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Anchor } from '../entities/anchor.entity';
import { MerkleService } from './merkle.service';
import { BlockchainService } from './blockchain.service';

const DEFAULT_CRON = '0 * * * *'; // mỗi đầu giờ
const DEFAULT_BATCH_SIZE = 1000;

// Advisory lock key — đảm bảo 2 instance của worker không chạy song song.
// Khác với CHAIN_LOCK_KEY ở audit.service (lock cho writeLog).
const ANCHOR_LOCK_KEY = 1095649869; // 0x41475255 ("AGRU")

/**
 * AnchorWorker — cron job mỗi giờ:
 *   1. Lấy unanchored audit logs (anchor_id IS NULL) theo seq_no
 *   2. Build Merkle tree từ list record_hash
 *   3. Gọi contract.storeAnchor(root, fromSeq, toSeq) trên Sepolia
 *   4. Save anchors row + update audit_logs.anchor_id (transactional)
 *
 * Idempotent: nếu DB transaction fail sau khi tx confirmed,
 * lần chạy sau sẽ retry với cùng dải logs → có thể có 2 anchor on-chain
 * cho cùng range, nhưng verify chỉ cần 1 root khớp là pass.
 */
@Injectable()
export class AnchorWorker {
  private readonly logger = new Logger(AnchorWorker.name);
  private readonly batchSize: number;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly merkle: MerkleService,
    private readonly blockchain: BlockchainService,
    @InjectDataSource() private readonly ds: DataSource,
    @InjectRepository(AuditLog) private readonly logRepo: Repository<AuditLog>,
    @InjectRepository(Anchor) private readonly anchorRepo: Repository<Anchor>,
  ) {
    this.batchSize = parseInt(
      this.config.get<string>('ANCHOR_BATCH_SIZE') ?? String(DEFAULT_BATCH_SIZE),
      10,
    );
  }

  @Cron(process.env.ANCHOR_CRON ?? DEFAULT_CRON)
  async runScheduled() {
    try {
      const result = await this.runOnce();
      if (result.skipped) {
        this.logger.debug(`Cron tick: ${result.reason ?? 'no logs to anchor'}`);
      } else {
        this.logger.log(
          `Cron tick: anchored ${result.count} logs in [${result.fromSeq}, ${result.toSeq}]`,
        );
      }
    } catch (err: any) {
      this.logger.error(`Cron tick failed: ${err?.message ?? err}`, err?.stack);
    }
  }

  // Thực hiện 1 lần anchor (không chạy đồng thời).
  async runOnce(): Promise<{
    skipped: boolean;
    reason?: string;
    count?: number;
    fromSeq?: string;
    toSeq?: string;
    anchorId?: string;
    txHash?: string;
    blockNumber?: number;
    merkleRoot?: string;
  }> {
    if (this.running) {
      return { skipped: true, reason: 'already running' };
    }
    if (!this.blockchain.isReady()) {
      return {
        skipped: true,
        reason:
          'blockchain not initialized — set ANCHOR_PRIVATE_KEY + ANCHOR_CONTRACT_ADDRESS in env',
      };
    }
    this.running = true;
    try {
      // Đảm bảo chỉ 1 worker chạy anchor (nếu có nhiều instance) bằng advisory lock.
      const lockResult = await this.ds.query(
        'SELECT pg_try_advisory_lock($1) AS locked',
        [ANCHOR_LOCK_KEY],
      );
      const locked = lockResult?.[0]?.locked === true;
      if (!locked) {
        return { skipped: true, reason: 'another worker holds advisory lock' };
      }

      try {
        return await this.executeAnchor();
      } finally {
        await this.ds.query('SELECT pg_advisory_unlock($1)', [ANCHOR_LOCK_KEY]);
      }
    } finally {
      this.running = false;
    }
  }

  private async executeAnchor() {
    // 1. Lấy batch audit logs chưa anchor (anchor_id IS NULL) theo seq_no
    const logs = await this.logRepo.find({
      where: { anchor_id: IsNull() },
      order: { seq_no: 'ASC' },
      take: this.batchSize,
    });
    if (logs.length === 0) {
      return { skipped: true, reason: 'no unanchored logs' };
    }

    const fromSeq = BigInt(logs[0].seq_no);
    const toSeq = BigInt(logs[logs.length - 1].seq_no);

    // 2. Build Merkle tree từ list record_hash
    const recordHashes = logs.map((l) => l.record_hash);
    const { root } = this.merkle.buildTree(recordHashes);

    // 3. Gọi contract.storeAnchor(root, fromSeq, toSeq) trên Sepolia
    const { txHash, blockNumber, onchainAnchorId } =
      await this.blockchain.submitAnchor(root, fromSeq, toSeq);

    // 4. Save anchor + update logs (transactional)
    const savedAnchorId = await this.ds.transaction(async (mgr) => {
      const anchor = await mgr.save(Anchor, {
        merkle_root: root,
        from_seq: fromSeq.toString(),
        to_seq: toSeq.toString(),
        tx_hash: txHash,
        block_number: String(blockNumber),
        chain_id: this.blockchain.getChainId(),
        onchain_anchor_id: onchainAnchorId.toString(),
      });
      // Update tất cả logs trong dải set anchor_id = anchor.id
      // WORM trigger cho phép set anchor_id từ NULL → not NULL
      await mgr
        .createQueryBuilder()
        .update(AuditLog)
        .set({ anchor_id: anchor.id })
        .where('seq_no BETWEEN :from AND :to AND anchor_id IS NULL', {
          from: fromSeq.toString(),
          to: toSeq.toString(),
        })
        .execute();
      return anchor.id;
    });

    return {
      skipped: false,
      count: logs.length,
      fromSeq: fromSeq.toString(),
      toSeq: toSeq.toString(),
      anchorId: savedAnchorId,
      txHash,
      blockNumber,
      merkleRoot: root,
    };
  }
}
