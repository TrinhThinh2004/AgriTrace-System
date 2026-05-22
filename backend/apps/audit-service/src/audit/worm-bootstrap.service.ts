import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
  * Cài đặt trigger WORM (Write Once Read Many) trên bảng audit_logs để đảm bảo tính toàn vẹn của dữ liệu audit log:
  * - Không cho phép DELETE bất kỳ record nào trong audit_logs.
  * - Chỉ cho phép UPDATE trường anchor_id từ NULL -> not NULL, và chỉ được phép thực hiện một lần duy nhất cho mỗi record
  *  (tức là sau khi anchor_id đã được set, không được phép thay đổi nữa).
  * 
  * Mục đích: đảm bảo rằng một khi một audit log đã được ghi vào database, nó sẽ không bao giờ bị xóa hoặc sửa đổi
  *  (ngoại trừ việc gán anchor_id khi nó được anchored on-chain). Điều này giúp tăng cường tính bảo mật và tin cậy của hệ thống audit.
 */
@Injectable()
export class WormBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WormBootstrapService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async onApplicationBootstrap() {
    // Tách thành 3 query riêng để tránh pg deprecation
    // "Calling client.query() when the client is already executing a query".
    // pg driver xử lý chuỗi SQL nhiều câu lệnh trên cùng 1 client gây trùng query.
    const createFunctionSql = `
CREATE OR REPLACE FUNCTION audit_log_worm() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_logs is WORM — DELETE not allowed (seq_no=%)', OLD.seq_no;
  END IF;
  -- UPDATE: only anchor_id may transition NULL -> not NULL, exactly once.
  IF TG_OP = 'UPDATE' THEN
    IF OLD.id <> NEW.id
       OR OLD.seq_no <> NEW.seq_no
       OR OLD.actor_id IS DISTINCT FROM NEW.actor_id
       OR OLD.actor_role IS DISTINCT FROM NEW.actor_role
       OR OLD.action <> NEW.action
       OR OLD.entity_type <> NEW.entity_type
       OR OLD.entity_id IS DISTINCT FROM NEW.entity_id
       OR OLD.before_data IS DISTINCT FROM NEW.before_data
       OR OLD.after_data IS DISTINCT FROM NEW.after_data
       OR OLD.metadata IS DISTINCT FROM NEW.metadata
       OR OLD.prev_hash <> NEW.prev_hash
       OR OLD.record_hash <> NEW.record_hash
       OR OLD.created_at <> NEW.created_at THEN
      RAISE EXCEPTION 'audit_logs is WORM — only anchor_id may change';
    END IF;
    IF OLD.anchor_id IS NOT NULL THEN
      RAISE EXCEPTION 'audit_logs is WORM — anchor_id already set (seq_no=%)', OLD.seq_no;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;
    const dropTriggerSql = `DROP TRIGGER IF EXISTS trg_audit_log_worm ON audit_logs;`;
    const createTriggerSql = `
CREATE TRIGGER trg_audit_log_worm
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_log_worm();
`;
    try {
      await this.ds.query(createFunctionSql);
      await this.ds.query(dropTriggerSql);
      await this.ds.query(createTriggerSql);
      this.logger.log('WORM trigger installed on audit_logs');
    } catch (e: any) {
      this.logger.error(`Failed to install WORM trigger: ${e.message}`);
      throw e;
    }
  }
}
