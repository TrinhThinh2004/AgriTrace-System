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
import { InspectionService } from './inspection.service';
import {
  CreateInspectionDto,
  UpdateInspectionDto,
  SignInspectionDto,
} from './dto';
import {
  CurrentUser,
  Roles,
  InspectorOnly,
  Public,
} from '../../../common/decorators';
import { Role } from '../../../common/enums';

@Controller()
export class InspectionController {
  constructor(private readonly service: InspectionService) {}

  // ─── Inspector tạo inspection dưới batch (OwnsBatch check ở gateway) ───
  // Ở đây farmer sở hữu batch không liên quan — inspector được phép tạo trên mọi batch,
  // nên KHÔNG dùng @OwnsBatch. Chỉ cần @InspectorOnly.
  @InspectorOnly()
  @Post('batches/:id/inspections')
  create(
    @Param('id') batchId: string,
    @Body() dto: CreateInspectionDto,
    @CurrentUser() user: any,
  ) {
    return this.service.create(batchId, dto, user);
  }

  // ─── Public: xem inspections theo batch (QR traceability) ───
  @Public()
  @Get('batches/:id/inspections')
  listByBatch(@Param('id') batchId: string) {
    return this.service.listByBatch(batchId);
  }

  // ─── List có filter + pagination (cần auth) ───
  @Roles(Role.ADMIN, Role.FARMER, Role.INSPECTOR)
  @Get('inspections')
  list(
    @CurrentUser() user: any,
    @Query('batch_id') batch_id?: string,
    @Query('inspector_id') inspector_id?: string,
    @Query('inspection_type') inspection_type?: string,
    @Query('result') result?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.list(
      { batch_id, inspector_id, inspection_type, result, page, limit },
      user,
    );
  }

  // ─── Public: xem 1 inspection ───
  @Public()
  @Get('inspections/:id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ─── Inspector update (tự check quyền trong service) ───
  @InspectorOnly()
  @Patch('inspections/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInspectionDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  // ─── Inspector delete (chỉ nếu chưa ký) ───
  @InspectorOnly()
  @Delete('inspections/:id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user);
  }

  // ─── Inspector ký inspection (store-only) ───
  @InspectorOnly()
  @Post('inspections/:id/sign')
  sign(
    @Param('id') id: string,
    @Body() dto: SignInspectionDto,
    @CurrentUser() user: any,
  ) {
    return this.service.sign(id, dto, user);
  }
}
