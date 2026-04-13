export interface ListActivityLogDto {
  batch_id?: string;
  activity_type?: string;
  performed_by?: string;
  page?: number;
  limit?: number;
}
