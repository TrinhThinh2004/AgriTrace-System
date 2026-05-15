import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CertificationService } from './certification.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';
import {
  AdminOnly,
  Auditable,
  CurrentUser,
  Roles,
} from '../../../common/decorators';
import { Role } from '../../../common/enums';
import { AUDIT_ACTIONS } from '@app/shared';

@Controller('certification-templates')
export class CertTemplateController {
  constructor(private readonly service: CertificationService) {}

  @AdminOnly()
  @Auditable(AUDIT_ACTIONS.CERT_TEMPLATE_CREATED, { entityType: 'CertificationTemplate' })
  @Post()
  create(@Body() dto: CreateTemplateDto, @CurrentUser() user: any) {
    return this.service.createTemplate(dto, user);
  }

  @AdminOnly()
  @Auditable(AUDIT_ACTIONS.CERT_TEMPLATE_UPDATED, { entityType: 'CertificationTemplate', entityIdParam: 'id' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @CurrentUser() user: any) {
    return this.service.updateTemplate(id, dto, user);
  }

  @Roles(Role.ADMIN, Role.FARMER, Role.INSPECTOR)
  @Get()
  list(
    @CurrentUser() user: any,
    @Query('cert_type') cert_type?: string,
    @Query('active_only') active_only?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.listTemplates(
      {
        cert_type,
        active_only: active_only === 'true',
        page,
        limit,
      },
      user,
    );
  }

  @Roles(Role.ADMIN, Role.FARMER, Role.INSPECTOR)
  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getTemplate({ id }, user);
  }
}
