import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import {
  CreateActivityLogDto,
  UpdateActivityLogDto,
  SignActivityLogDto,
} from './dto';
import {
  CurrentUser,
  Roles,
  FarmerOnly,
  OwnsBatch,
  Public,
} from '../../../common/decorators';
import { Role } from '../../../common/enums';

@Controller()
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  // ─── Farmer tạo log dưới batch mình sở hữu ───
  @FarmerOnly()
  @OwnsBatch('id')
  @Post('batches/:id/activity-logs')
  create(
    @Param('id') batchId: string,
    @Body() dto: CreateActivityLogDto,
    @CurrentUser() user: any,
  ) {
    return this.service.create(batchId, dto, user);
  }

  // ─── Public: xem activity logs theo batch (QR traceability) ───
  @Public()
  @Get('batches/:id/activity-logs')
  listByBatch(@Param('id') batchId: string) {
    return this.service.listByBatch(batchId);
  }

  // ─── List có filter + pagination (cần auth) ───
  @Roles(Role.ADMIN, Role.FARMER, Role.INSPECTOR)
  @Get('activity-logs')
  list(
    @CurrentUser() user: any,
    @Query('batch_id') batch_id?: string,
    @Query('activity_type') activity_type?: string,
    @Query('performed_by') performed_by?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.list(
      { batch_id, activity_type, performed_by, page, limit },
      user,
    );
  }

  // ─── Public: xem 1 activity log ───
  @Public()
  @Get('activity-logs/:id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ─── Farmer update (service tự self-check ownership) ───
  @FarmerOnly()
  @Patch('activity-logs/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityLogDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  // ─── Farmer delete (chỉ nếu chưa ký) ───
  @FarmerOnly()
  @Delete('activity-logs/:id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user);
  }

  // ─── Farmer ký activity log (chữ ký số, store-only) ───
  @FarmerOnly()
  @Post('activity-logs/:id/sign')
  sign(
    @Param('id') id: string,
    @Body() dto: SignActivityLogDto,
    @CurrentUser() user: any,
  ) {
    return this.service.sign(id, dto, user);
  }
}
