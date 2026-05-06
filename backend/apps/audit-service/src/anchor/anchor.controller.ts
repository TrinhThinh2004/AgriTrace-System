import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AnchorWorker } from './anchor.worker';

/**
 * gRPC handler cho method TriggerAnchor — cho phép api-gateway dev endpoint
 * `POST /audit/_dev/anchor-now` chạy anchor thủ công thay vì đợi cron 1h.
 */
@Controller()
export class AnchorController {
  constructor(private readonly worker: AnchorWorker) {}

  @GrpcMethod('AuditService', 'TriggerAnchor')
  async triggerAnchor() {
    const result = await this.worker.runOnce();
    // Convert sang shape proto (mọi field string)
    return {
      skipped: result.skipped,
      reason: result.reason ?? '',
      count: result.count ?? 0,
      from_seq: result.fromSeq ?? '',
      to_seq: result.toSeq ?? '',
      anchor_id: result.anchorId ?? '',
      tx_hash: result.txHash ?? '',
      block_number: result.blockNumber ? String(result.blockNumber) : '',
      merkle_root: result.merkleRoot ?? '',
    };
  }
}
