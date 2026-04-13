import { ActivityType } from '@app/shared';
import { InputUsed } from './create-activity-log.dto';

export interface UpdateActivityLogDto {
  activity_type?: ActivityType | string;
  performed_at?: string;
  location?: string;
  notes?: string;
  inputs_used?: InputUsed[];
}
