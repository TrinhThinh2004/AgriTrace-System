import { Injectable, Logger } from '@nestjs/common';
import {
  RabbitSubscribe,
  MessageHandlerErrorBehavior,
} from '@golevelup/nestjs-rabbitmq';
import {
  RABBIT_EXCHANGE,
  RABBIT_DLX,
  AUDIT_LOG_ROUTING_KEY,
  AUDIT_LOG_QUEUE,
  AUDIT_LOG_DLQ_ROUTING_KEY,
  AuditLogMessage,
} from '@app/shared';
import { AuditService } from './audit.service';

// hàm tiện ích để parse JSON an toàn, trả về null nếu input không hợp lệ hoặc không phải là object.
function parseJson(s: string | undefined | null): Record<string, any> | null {
  if (!s) return null;
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

@Injectable()
export class AuditLogConsumer {
  private readonly logger = new Logger(AuditLogConsumer.name);

  constructor(private readonly auditService: AuditService) {}

  // Consume queue audit.log.write.queue: nhận event từ api-gateway và ghi vào WORM table.
  // Khi handler throw → NACK với requeue=false → message vào DLQ để admin inspect.
  @RabbitSubscribe({
    exchange: RABBIT_EXCHANGE,
    routingKey: AUDIT_LOG_ROUTING_KEY,
    queue: AUDIT_LOG_QUEUE,
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBIT_DLX,
        'x-dead-letter-routing-key': AUDIT_LOG_DLQ_ROUTING_KEY,
      },
    },
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  async handle(msg: AuditLogMessage) {
    await this.auditService.writeLog({
      actor_id: msg.actor_id || null,
      actor_role: msg.actor_role || null,
      action: msg.action,
      entity_type: msg.entity_type,
      entity_id: msg.entity_id || null,
      before_data: parseJson(msg.before_data),
      after_data: parseJson(msg.after_data),
      metadata: parseJson(msg.metadata),
      occurred_at: msg.occurred_at,
    });
    this.logger.debug(`audit log written: ${msg.action} ${msg.entity_type}`);
  }
}
