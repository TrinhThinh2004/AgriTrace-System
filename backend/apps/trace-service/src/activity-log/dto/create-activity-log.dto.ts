import { ActivityType } from '@app/shared';

export interface InputUsed {
  name: string;
  quantity: string;
  unit: string;
}

export interface CreateActivityLogDto {
  batch_id: string;
  activity_type: ActivityType | string;
  performed_by: string;
  performed_at: string;
  location?: string;
  notes?: string;
  inputs_used?: InputUsed[];
}
