import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators';
import { NotificationService } from './notification.service';

type AuthUser = { id: string; role: string };

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('only_unread') onlyUnread?: string,
  ) {
    return this.notificationService.list(
      user,
      Number(page) || 1,
      Number(limit) || 20,
      onlyUnread === 'true' || onlyUnread === '1',
    );
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationService.unreadCount(user);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notificationService.markAllAsRead(user);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notificationService.markAsRead(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notificationService.delete(id, user);
  }
}
