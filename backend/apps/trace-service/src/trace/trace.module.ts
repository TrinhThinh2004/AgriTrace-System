import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { Inspection } from '../entities/inspection.entity';

/**
 * TraceModule — quản lý nhật ký hoạt động và kiểm định.
 * gRPC handlers sẽ được implement trong sprint tiếp theo.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog, Inspection])],
  controllers: [],
  providers: [],
})
export class TraceModule {}
