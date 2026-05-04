import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  OnModuleInit,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, tap } from 'rxjs';
import { AUDITABLE_KEY, AuditableMeta } from '../decorators/auditable.decorator';

interface AuditGrpcService {
  writeLog(payload: WriteLogPayload): Observable<unknown>;
}

interface WriteLogPayload {
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
export class AuditableInterceptor implements NestInterceptor, OnModuleInit {
  private readonly logger = new Logger(AuditableInterceptor.name);
  private auditGrpc!: AuditGrpcService;

  constructor(
    private readonly reflector: Reflector,
    @Inject('AUDIT_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.auditGrpc = this.client.getService<AuditGrpcService>('AuditService');
  }

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
        try {
          this.dispatch(meta, req, response);
        } catch (err: any) {
          this.logger.warn(`audit dispatch failed: ${err?.message ?? err}`);
        }
      }),
    );
  }

  // Hàm dispatch để gửi log audit đến audit-service qua gRPC
  private dispatch(meta: AuditableMeta, req: any, response: any) {
    const user = req.user ?? {};
    const entityIdFromParam = meta.entityIdParam ? req.params?.[meta.entityIdParam] : undefined;
    const entityIdFromResponse =
      response && typeof response === 'object' && 'id' in response ? (response as any).id : null;
    const entityId = String(entityIdFromParam ?? entityIdFromResponse ?? '');

    const payload: WriteLogPayload = {
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

    // Gửi payload đến audit-service qua gRPC, không cần chờ phản hồi
    this.auditGrpc.writeLog(payload).subscribe({
      error: (e) =>
        this.logger.warn(
          `WriteLog ${meta.action} failed: ${e?.message ?? e?.code ?? 'unknown'}`,
        ),
    });
  }
}
