import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Observable, tap } from 'rxjs';
import {
  RABBIT_EXCHANGE,
  AUDIT_LOG_ROUTING_KEY,
  AuditLogMessage,
} from '@app/shared';
import { AUDITABLE_KEY, AuditableMeta } from '../decorators/auditable.decorator';

const SENSITIVE_KEY_HINTS = [
  'password',
  'pwd',
  'pass_hash',
  'password_hash',
  'token',
  'refresh_token',
  'access_token',
  'private_key',
  'privatekey',
  'secret',
  'api_key',
  'apikey',
];

const REDACTED = '***REDACTED***';
// Hàm đệ quy để sanitize dữ liệu, 
// thay thế giá trị của các field nhạy cảm như password, token bằng '***REDACTED***'
//  và cắt ngắn mảng nếu quá dài
function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 6) return '<truncated>';
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => sanitize(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    const isSensitive = SENSITIVE_KEY_HINTS.some((s) => k.toLowerCase().includes(s));
    out[k] = isSensitive ? REDACTED : sanitize(v, depth + 1);
  }
  return out;
}

function safeStringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  try {
    const s = JSON.stringify(value);
    // Nếu stringified data quá lớn (>256KB), trả về một string thông báo đã bị cắt ngắn
    if (s.length > 256 * 1024) return JSON.stringify({ truncated: true, size: s.length });
    return s;
  } catch {
    return '';
  }
}

@Injectable()
export class AuditableInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditableInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly amqp: AmqpConnection,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const meta = this.reflector.get<AuditableMeta | undefined>(
      AUDITABLE_KEY,
      context.getHandler(),
    );
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap((response) => {
        // dispatch async, không block response. Lỗi publish sẽ tự log trong dispatch().
        void this.dispatch(meta, req, response);
      }),
    );
  }

  // Publish audit log lên RabbitMQ (persistent queue). audit-service consume bất đồng bộ.
  // Nếu broker tạm down, AmqpConnection sẽ buffer message và publish khi reconnect.
  private async dispatch(meta: AuditableMeta, req: any, response: any) {
    const user = req.user ?? {};
    const entityIdFromParam = meta.entityIdParam ? req.params?.[meta.entityIdParam] : undefined;
    const entityIdFromResponse =
      response && typeof response === 'object' && 'id' in response ? (response as any).id : null;
    const entityId = String(entityIdFromParam ?? entityIdFromResponse ?? '');

    const payload: AuditLogMessage = {
      actor_id: String(user.id ?? ''),
      actor_role: String(user.role ?? ''),
      action: meta.action,
      entity_type: meta.entityType,
      entity_id: entityId,
      before_data: '',
      after_data: safeStringify(sanitize(response)),
      metadata: safeStringify({
        ip: req.ip ?? null,
        user_agent: req.headers?.['user-agent'] ?? null,
        method: req.method,
        path: req.originalUrl ?? req.url,
        body: sanitize(req.body),
        params: req.params,
        query: req.query,
      }),
      occurred_at: new Date().toISOString(),
    };

    try {
      await this.amqp.publish(RABBIT_EXCHANGE, AUDIT_LOG_ROUTING_KEY, payload, {
        persistent: true,
        contentType: 'application/json',
      });
    } catch (err: any) {
      this.logger.warn(
        `audit publish ${meta.action} failed: ${err?.message ?? err}`,
      );
    }
  }
}
