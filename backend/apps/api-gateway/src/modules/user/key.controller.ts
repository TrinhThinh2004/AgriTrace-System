import { Controller, Get, Post, Param } from '@nestjs/common';
import { KeyService } from './key.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../common/enums';

@Controller('users/me/keys')
export class KeyController {
  constructor(private readonly keyService: KeyService) {}
  // Chỉ cho phép FARMER và INSPECTOR mới được quản lý key
  @Roles(Role.FARMER, Role.INSPECTOR)
  @Post('generate')
  generate(@CurrentUser() user: any) {
    return this.keyService.generate(user.id);
  }


  @Roles(Role.FARMER, Role.INSPECTOR)
  @Get()
  list(@CurrentUser() user: any) {
    return this.keyService.list(user.id);
  }

  @Roles(Role.FARMER, Role.INSPECTOR)
  @Post(':keyId/revoke')
  revoke(@Param('keyId') keyId: string, @CurrentUser() user: any) {
    return this.keyService.revoke(keyId, user.id);
  }
}
