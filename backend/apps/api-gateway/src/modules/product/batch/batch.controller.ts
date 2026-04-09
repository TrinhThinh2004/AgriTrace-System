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
import { BatchService } from './batch.service';
import { CreateBatchDto, UpdateBatchDto, TransitionBatchDto } from './dto';
import { CurrentUser, Roles, OwnsBatch, FarmerOnly } from '../../../common/decorators';
import { Role } from '../../../common/enums';

@Controller('batches')
export class BatchController {
  constructor(private readonly service: BatchService) {}

  @FarmerOnly()
  @Post()
  create(@Body() dto: CreateBatchDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Roles(Role.ADMIN, Role.FARMER, Role.INSPECTOR)
  @Get()
  list(
    @CurrentUser() user: any,
    @Query('farm_id') farm_id?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.list({ farm_id, status, page, limit }, user);
  }

  @OwnsBatch('id')
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findById(id, user);
  }

  @OwnsBatch('id')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBatchDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @OwnsBatch('id')
  @Post(':id/transition')
  transitionStatus(
    @Param('id') id: string,
    @Body() dto: TransitionBatchDto,
    @CurrentUser() user: any,
  ) {
    return this.service.transitionStatus(id, dto, user);
  }

  @OwnsBatch('id')
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user);
  }
}
