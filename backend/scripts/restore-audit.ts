/**
 * Restore script — undo demo-tampering bằng cách recompute record_hash
 * từ payload hiện tại của log đã sửa.
 *
 * Lưu ý: chỉ dùng để CLEANUP sau demo. Không dùng cho production.
 *
 * Cách chạy:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register scripts/restore-audit.ts [seq_no]
 */
import { Client } from 'pg';
import { createHash } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const SEQ_NO = process.argv[2] ?? '1';

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number')
    return Number.isFinite(value) ? JSON.stringify(value) : 'null';
  if (typeof value === 'boolean' || typeof value === 'string')
    return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as object).sort();
    return (
      '{' +
      keys
        .map((k) => JSON.stringify(k) + ':' + canonicalize((value as any)[k]))
        .join(',') +
      '}'
    );
  }
  return 'null';
}

async function main() {
  const db = new Client({
    host: process.env.AUDIT_DB_HOST ?? 'localhost',
    port: parseInt(process.env.AUDIT_DB_PORT ?? '5437', 10),
    user: process.env.AUDIT_DB_USER ?? 'audit_admin',
    password: process.env.AUDIT_DB_PASS ?? 'audit_pass123',
    database: process.env.AUDIT_DB_NAME ?? 'agritrace_audit',
  });
  await db.connect();

  const r = await db.query(
    `SELECT seq_no, actor_id, actor_role, action, entity_type, entity_id,
            before_data, after_data, metadata, prev_hash, record_hash
       FROM audit_logs WHERE seq_no = $1`,
    [SEQ_NO],
  );
  if (r.rows.length === 0) {
    console.error(`Không tìm thấy seq_no=${SEQ_NO}`);
    process.exit(1);
  }
  const log = r.rows[0];

  const occurredAt = log.metadata?.occurred_at ?? null;
  const { occurred_at: _ignored, ...restMeta } = log.metadata ?? {};
  const cleanMeta =
    Object.keys(restMeta).length > 0 ? restMeta : null;

  const payload = {
    actor_id: log.actor_id,
    actor_role: log.actor_role,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    before_data: log.before_data,
    after_data: log.after_data,
    metadata: cleanMeta,
    occurred_at: occurredAt,
  };

  const recomputed = createHash('sha256')
    .update(log.prev_hash)
    .update(canonicalize(payload))
    .digest('hex');

  console.log(`seq_no:        ${log.seq_no}`);
  console.log(`stored hash:   ${log.record_hash}`);
  console.log(`recomputed:    ${recomputed}`);

  if (recomputed === log.record_hash) {
    console.log('✓ Hash đã khớp — không cần restore');
    await db.end();
    return;
  }

  console.log('→ Hash mismatch detected. Bypassing trigger to set record_hash = recomputed...');
  await db.query('ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_log_worm');
  await db.query(
    'UPDATE audit_logs SET record_hash = $1 WHERE seq_no = $2',
    [recomputed, SEQ_NO],
  );
  await db.query('ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_log_worm');
  console.log(`✓ record_hash của seq_no=${SEQ_NO} đã được restore.`);

  await db.end();
}

main().catch((err) => {
  console.error('Restore failed:', err);
  process.exit(1);
});
