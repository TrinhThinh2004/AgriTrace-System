import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators';
import {
  AiService,
  type SuggestActivityLogDto,
  type SuggestBatchPlantingDto,
  type SuggestInspectionDto,
} from './ai.service';

type AuthUser = { id: string; role: string };

@Controller('ai/suggest')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('batch-planting')
  suggestBatchPlanting(
    @CurrentUser() user: AuthUser,
    @Body() body: SuggestBatchPlantingDto,
  ) {
    return this.aiService.suggestBatchPlanting(user, body ?? {});
  }

  @Post('activity-log')
  suggestActivityLog(
    @CurrentUser() user: AuthUser,
    @Body() body: SuggestActivityLogDto,
  ) {
    return this.aiService.suggestActivityLog(user, body);
  }

  @Post('inspection-summary')
  suggestInspectionSummary(
    @CurrentUser() user: AuthUser,
    @Body() body: SuggestInspectionDto,
  ) {
    return this.aiService.suggestInspectionSummary(user, body);
  }
}
