import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

// AuditModule — module chứa AuditController (nếu cần)
//  và AuditService để các module khác có thể inject và gọi trực tiếp (nếu cần).
@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
