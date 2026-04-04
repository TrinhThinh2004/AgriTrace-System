import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { Inspection } from './entities/inspection.entity';
import { QRCode } from './entities/qr-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog, ChecklistItem, Inspection, QRCode]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class TraceModule { }
