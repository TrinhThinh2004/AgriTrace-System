import { InspectionType, InspectionResult } from '@app/shared';

export interface UpdateInspectionDto {
  inspection_type?: InspectionType | string;
  result?: InspectionResult | string;
  scheduled_at?: string;
  conducted_at?: string;
  notes?: string;
  report_url?: string;
}
