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
import { FarmService } from './farm.service';
import {
  CreateFarmDto,
  UpdateFarmDto,
  RequestCertificationDto,
  RejectCertificationDto,
  ApproveCertificationDto,
} from './dto';
import { CurrentUser, Roles, OwnsFarm, Auditable } from '../../../common/decorators';
import { Role } from '../../../common/enums';
import { AUDIT_ACTIONS } from '@app/shared';

@Controller('farms')
export class FarmController {
  constructor(private readonly service: FarmService) {}

  @Roles(Role.ADMIN, Role.FARMER)
  @Auditable(AUDIT_ACTIONS.FARM_CREATED, { entityType: 'Farm' })
  @Post()
  create(@Body() dto: CreateFarmDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Roles(Role.ADMIN, Role.FARMER)
  @Get()
  list(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('certification_status') certification_status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Farmer chỉ thấy farm mình; Admin thấy tất cả
    const owner_id = user.role === Role.ADMIN ? undefined : user.id;
    return this.service.list(
      { owner_id, status, certification_status, page, limit },
      user,
    );
  }

  @OwnsFarm('id')
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findById(id, user);
  }

  @OwnsFarm('id')
  @Auditable(AUDIT_ACTIONS.FARM_UPDATED, { entityType: 'Farm', entityIdParam: 'id' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFarmDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @OwnsFarm('id')
  @Auditable(AUDIT_ACTIONS.FARM_DELETED, { entityType: 'Farm', entityIdParam: 'id' })
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user);
  }

  // Farmer (owner) hoặc Admin gửi yêu cầu cấp chứng nhận
  @OwnsFarm('id')
  @Auditable(AUDIT_ACTIONS.CERT_REQUESTED, { entityType: 'Farm', entityIdParam: 'id' })
  @Post(':id/certification-request')
  requestCertification(
    @Param('id') id: string,
    @Body() dto: RequestCertificationDto,
    @CurrentUser() user: any,
  ) {
    return this.service.requestCertification(id, dto.requested_type, user);
  }

  @Roles(Role.ADMIN)
  @Auditable(AUDIT_ACTIONS.CERT_APPROVED, { entityType: 'Farm', entityIdParam: 'id' })
  @Post(':id/certification/approve')
  approveCertification(
    @Param('id') id: string,
    @Body() dto: ApproveCertificationDto,
    @CurrentUser() user: any,
  ) {
    return this.service.approveCertification(id, user, dto.granted_type);
  }

  @Roles(Role.ADMIN)
  @Auditable(AUDIT_ACTIONS.CERT_REJECTED, { entityType: 'Farm', entityIdParam: 'id' })
  @Post(':id/certification/reject')
  rejectCertification(
    @Param('id') id: string,
    @Body() dto: RejectCertificationDto,
    @CurrentUser() user: any,
  ) {
    return this.service.rejectCertification(id, dto.reason, user);
  }
}
