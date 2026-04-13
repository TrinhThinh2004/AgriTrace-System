import { InspectionType, InspectionResult } from '@app/shared';

export interface CreateInspectionDto {
  batch_id: string;
  inspector_id: string;
  inspection_type: InspectionType | string;
  result?: InspectionResult | string;
  scheduled_at?: string;
  conducted_at?: string;
  notes?: string;
  report_url?: string;
}
