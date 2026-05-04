import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { Roles, Auditable } from '../../common/decorators';
import { Role } from '../../common/enums';
import { AUDIT_ACTIONS } from '@app/shared';

import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.ADMIN)
  @Get()
  list(@Query('role') role?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.userService.list(role, Number(page) || 1, Number(limit) || 50);
  }

  @Roles(Role.ADMIN)
  @Auditable(AUDIT_ACTIONS.USER_CREATED, { entityType: 'User' })
  @Post()
  create(@Body() dto: any) {
    return this.userService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Auditable(AUDIT_ACTIONS.USER_UPDATED, { entityType: 'User', entityIdParam: 'id' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.userService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Auditable(AUDIT_ACTIONS.USER_DELETED, { entityType: 'User', entityIdParam: 'id' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
