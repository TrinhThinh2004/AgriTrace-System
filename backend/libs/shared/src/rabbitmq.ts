// Constants chung cho RabbitMQ — producer và consumer dùng chung để tránh sai routing key.
// exchange để publish event, 
export const RABBIT_EXCHANGE = 'agritrace.events'; 
// DLX để chứa message failed, admin có thể inspect và requeue nếu cần.
export const RABBIT_DLX = 'agritrace.dlx'; 

// Routing key và queue cho audit log
export const AUDIT_LOG_ROUTING_KEY = 'audit.log.write';
export const AUDIT_LOG_QUEUE = 'audit.log.write.queue';
export const AUDIT_LOG_DLQ_ROUTING_KEY = 'audit.log.failed';

// Routing key và queue cho notification dispatch
export const NOTIFICATION_DISPATCH_ROUTING_KEY = 'notification.dispatch';
export const NOTIFICATION_DISPATCH_QUEUE = 'notification.dispatch.queue';
export const NOTIFICATION_DISPATCH_DLQ_ROUTING_KEY = 'notification.failed';

// Payload schema (dùng cho cả producer và consumer)

export interface AuditLogMessage {
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_data: string;
  after_data: string;
  metadata: string;
  occurred_at: string;
}

export interface NotificationDispatchMessage {
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: string;
}
