import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { KeyService } from './key.service';
import { AdminOnly } from '../../common/decorators';

@Controller('admin/keys')
export class AdminKeyController {
  constructor(private readonly keyService: KeyService) {}

  @AdminOnly()
  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('user_id') userId?: string,
  ) {
    return this.keyService.listAll(
      Number(page) || 1,
      Number(limit) || 50,
      status,
      userId,
    );
  }

  @AdminOnly()
  @Post(':keyId/revoke')
  revoke(@Param('keyId') keyId: string) {
    return this.keyService.adminRevoke(keyId);
  }
}
