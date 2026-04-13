import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { InspectionModule } from '../inspection/inspection.module';

/**
 * TraceModule — quản lý nhật ký hoạt động và kiểm định.
 * Gom 2 sub-module ActivityLog + Inspection, mỗi sub-module tự import
 * TypeOrmModule.forFeature cho entity của nó.
 */
@Module({
  imports: [ActivityLogModule, InspectionModule],
})
export class TraceModule {}
