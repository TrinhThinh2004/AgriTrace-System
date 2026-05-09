/**
 * Demo tampering script — chứng minh tính bất biến của audit log.
 *
 * Kịch bản:
 *   1. Đọc 1 audit log target (default seq_no=1) → in record_hash gốc
 *   2. Disable trigger WORM tạm thời (giả lập attacker có quyền superuser DB)
 *   3. UPDATE action của record (giả lập tampering)
 *   4. Re-enable trigger WORM
 *   5. Đọc lại record → so sánh: record_hash trong DB CŨ, nhưng action MỚI
 *      → Khi verify endpoint chạy lại sha256(prev_hash || canonical(payload mới))
 *        sẽ ra hash khác → mismatch → tampering detected
 *
 * Cách chạy:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register scripts/demo-tampering.ts [seq_no]
 *
 * Sau khi chạy, mở /audit/{seq_no}/verify trên FE → Section 1 sẽ hiện ✗ "Không khớp".
 */
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const SEQ_NO = process.argv[2] ?? '1';

const config = {
  host: process.env.AUDIT_DB_HOST ?? 'localhost',
  port: parseInt(process.env.AUDIT_DB_PORT ?? '5437', 10),
  user: process.env.AUDIT_DB_USER ?? 'audit_admin',
  password: process.env.AUDIT_DB_PASS ?? 'audit_pass123',
  database: process.env.AUDIT_DB_NAME ?? 'agritrace_audit',
};

function line(c = '─', n = 60) {
  return c.repeat(n);
}

async function main() {
  const db = new Client(config);
  await db.connect();

  console.log(line('═'));
  console.log(' DEMO TAMPERING — AgriTrace audit_logs');
  console.log(` Target: seq_no=${SEQ_NO}`);
  console.log(line('═'));

  // STEP 1 — Read original
  const before = await db.query(
    `SELECT seq_no, action, entity_type, prev_hash, record_hash, anchor_id
       FROM audit_logs WHERE seq_no = $1`,
    [SEQ_NO],
  );
  if (before.rows.length === 0) {
    console.error(`✗ Không tìm thấy audit log seq_no=${SEQ_NO}`);
    await db.end();
    process.exit(1);
  }
  const original = before.rows[0];
  console.log('\n[1] BEFORE TAMPERING');
  console.log(`    action       = ${original.action}`);
  console.log(`    entity_type  = ${original.entity_type}`);
  console.log(`    prev_hash    = ${original.prev_hash}`);
  console.log(`    record_hash  = ${original.record_hash}`);
  console.log(
    `    anchor_id    = ${original.anchor_id ?? '(chưa anchor)'}`,
  );

  // STEP 2 — Disable trigger
  console.log('\n[2] DISABLE WORM trigger (giả lập attacker có quyền superuser)');
  await db.query('ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_log_worm');

  // STEP 3 — Tamper
  const newAction = `${original.action}_HACKED_${Date.now()}`;
  console.log(`\n[3] TAMPER: UPDATE audit_logs SET action='${newAction}' WHERE seq_no=${SEQ_NO}`);
  await db.query('UPDATE audit_logs SET action = $1 WHERE seq_no = $2', [
    newAction,
    SEQ_NO,
  ]);

  // STEP 4 — Re-enable trigger
  await db.query('ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_log_worm');
  console.log('[4] RE-ENABLE WORM trigger (xoá dấu vết tampering)');

  // STEP 5 — Read after
  const after = await db.query(
    `SELECT seq_no, action, prev_hash, record_hash
       FROM audit_logs WHERE seq_no = $1`,
    [SEQ_NO],
  );
  const tampered = after.rows[0];
  console.log('\n[5] AFTER TAMPERING (đứng nhìn từ DB)');
  console.log(`    action       = ${tampered.action}    ← ĐÃ ĐỔI`);
  console.log(`    record_hash  = ${tampered.record_hash}    ← VẪN GIỮ HASH CŨ`);

  console.log('\n' + line('─'));
  console.log(' QUAN SÁT:');
  console.log(' • DB hiện tại: action MỚI, nhưng record_hash là hash của action CŨ.');
  console.log(' • Khi verify endpoint chạy:');
  console.log('     recomputed = sha256(prev_hash || canonical(payload với action MỚI))');
  console.log('     → ≠ record_hash đang lưu');
  console.log('     → hash_chain_valid = FALSE');
  if (original.anchor_id) {
    console.log(' • Log đã được anchor → khi rebuild Merkle tree, leaf hash khác →');
    console.log('     root tính lại ≠ root on-chain → onchain_root_match = FALSE');
  } else {
    console.log(' • Log CHƯA anchor → chỉ phát hiện qua hash_chain_valid (Lớp 1).');
    console.log('   Sau khi anchor → Lớp 2 cũng fail.');
  }
  console.log(line('─'));
  console.log('\n→ Mở trang /audit/' + SEQ_NO + '/verify trên frontend để thấy ✗ MISMATCH');
  console.log('  hoặc gọi: GET http://localhost:8000/audit/' + SEQ_NO + '/verify');
  console.log();

  await db.end();
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
