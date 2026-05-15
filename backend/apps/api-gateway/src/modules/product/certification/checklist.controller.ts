import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CertificationService } from './certification.service';
import {
  ApproveChecklistDto,
  RejectChecklistDto,
  StartChecklistDto,
  UpsertAnswerDto,
} from './dto';
import {
  AdminOnly,
  Auditable,
  CurrentUser,
  OwnsFarm,
  Roles,
} from '../../../common/decorators';
import { Role } from '../../../common/enums';
import { AUDIT_ACTIONS } from '@app/shared';

@Controller()
export class ChecklistController {
  constructor(private readonly service: CertificationService) {}

  // Farmer (owner farm) hoặc Admin start checklist cho farm
  @OwnsFarm('farmId')
  @Auditable(AUDIT_ACTIONS.CERT_CHECKLIST_STARTED, {
    entityType: 'ChecklistResponse',
    entityIdParam: 'farmId',
  })
  @Post('farms/:farmId/checklist-responses')
  start(
    @Param('farmId') farmId: string,
    @Body() dto: StartChecklistDto,
    @CurrentUser() user: any,
  ) {
    return this.service.startResponse(farmId, dto.template_id, user);
  }

  // Lấy response mới nhất theo farm
  @OwnsFarm('farmId')
  @Get('farms/:farmId/checklist-responses/latest')
  getLatest(@Param('farmId') farmId: string, @CurrentUser() user: any) {
    return this.service.getLatestByFarm(farmId, user);
  }

  // Admin xem chi tiết 1 response (admin có thể xem mọi response)
  @Roles(Role.ADMIN, Role.FARMER)
  @Get('checklist-responses/:id')
  getById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getResponseById(id, user);
  }

  // Farmer upsert answer 1 item (only DRAFT)
  @Roles(Role.ADMIN, Role.FARMER)
  @Auditable(AUDIT_ACTIONS.CERT_CHECKLIST_ANSWER_UPDATED, {
    entityType: 'ChecklistResponse',
    entityIdParam: 'id',
  })
  @Patch('checklist-responses/:id/items/:itemId')
  upsertAnswer(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpsertAnswerDto,
    @CurrentUser() user: any,
  ) {
    return this.service.upsertAnswer(id, itemId, dto, user);
  }

  // Farmer submit (DRAFT → SUBMITTED)
  @Roles(Role.ADMIN, Role.FARMER)
  @Auditable(AUDIT_ACTIONS.CERT_CHECKLIST_SUBMITTED, {
    entityType: 'ChecklistResponse',
    entityIdParam: 'id',
  })
  @Post('checklist-responses/:id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.submitResponse(id, user);
  }

  // Admin approve (SUBMITTED → APPROVED, Farm.cert_status = granted_type)
  @AdminOnly()
  @Auditable(AUDIT_ACTIONS.CERT_CHECKLIST_APPROVED, {
    entityType: 'ChecklistResponse',
    entityIdParam: 'id',
  })
  @Post('checklist-responses/:id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveChecklistDto,
    @CurrentUser() user: any,
  ) {
    return this.service.approveResponse(id, dto, user);
  }

  // Admin reject (SUBMITTED → REJECTED, Farm.cert_status = NONE)
  @AdminOnly()
  @Auditable(AUDIT_ACTIONS.CERT_CHECKLIST_REJECTED, {
    entityType: 'ChecklistResponse',
    entityIdParam: 'id',
  })
  @Post('checklist-responses/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectChecklistDto,
    @CurrentUser() user: any,
  ) {
    return this.service.rejectResponse(id, dto, user);
  }
}
