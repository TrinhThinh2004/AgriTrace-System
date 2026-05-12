import { Injectable, Logger } from '@nestjs/common';
import {
  RabbitSubscribe,
  MessageHandlerErrorBehavior,
} from '@golevelup/nestjs-rabbitmq';
import {
  RABBIT_EXCHANGE,
  RABBIT_DLX,
  NOTIFICATION_DISPATCH_ROUTING_KEY,
  NOTIFICATION_DISPATCH_QUEUE,
  NOTIFICATION_DISPATCH_DLQ_ROUTING_KEY,
  NotificationDispatchMessage,
} from '@app/shared';
import { NotificationService } from './notification.service';

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
export class NotificationDispatchConsumer {
  private readonly logger = new Logger(NotificationDispatchConsumer.name);

  constructor(private readonly notificationService: NotificationService) {}

  // Consume queue notification.dispatch.queue: nhận event từ trace-service (hoặc service khác),
  // tạo notification trong DB và publish Redis → WebSocket gateway broadcast cho client.
  // Handler throw → NACK requeue=false → message vào DLQ.
  @RabbitSubscribe({
    exchange: RABBIT_EXCHANGE,
    routingKey: NOTIFICATION_DISPATCH_ROUTING_KEY,
    queue: NOTIFICATION_DISPATCH_QUEUE,
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBIT_DLX,
        'x-dead-letter-routing-key': NOTIFICATION_DISPATCH_DLQ_ROUTING_KEY,
      },
    },
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  async handle(msg: NotificationDispatchMessage) {
    await this.notificationService.create({
      user_id: msg.user_id,
      type: msg.type,
      title: msg.title,
      message: msg.message,
      link: msg.link ?? null,
      data: parseJson(msg.data),
    });
    this.logger.debug(
      `notification dispatched to user=${msg.user_id} type=${msg.type}`,
    );
  }
}
