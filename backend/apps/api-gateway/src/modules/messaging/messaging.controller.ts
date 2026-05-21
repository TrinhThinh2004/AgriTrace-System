import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators';
import { MessagingService } from './messaging.service';

type AuthUser = { id: string; role: string };

@Controller('messages')
export class MessagingController {
  constructor(private readonly service: MessagingService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthUser) {
    return this.service.listConversations(user);
  }

  @Post('conversations')
  createOrGetConversation(
    @CurrentUser() user: AuthUser,
    @Body() body: { other_user_id: string },
  ) {
    return this.service.getOrCreateConversation(user, body.other_user_id);
  }

  @Get('conversations/:id/messages')
  listMessages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.listMessages(user, id, Number(page) || 1, Number(limit) || 30);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.service.sendMessage(user, id, body.content);
  }

  @Patch('conversations/:id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.markConversationRead(user, id);
  }

  @Get('unread-count')
  totalUnread(@CurrentUser() user: AuthUser) {
    return this.service.totalUnread(user);
  }

  /** Danh sách user khác để bắt đầu chat — mọi role đăng nhập đều gọi được */
  @Get('contacts')
  listContacts(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
  ) {
    return this.service.listContacts(user, search);
  }
}
