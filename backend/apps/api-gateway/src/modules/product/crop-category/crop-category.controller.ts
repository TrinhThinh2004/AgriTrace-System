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
import { CropCategoryService } from './crop-category.service';
import { CreateCropCategoryDto, UpdateCropCategoryDto } from './dto';
import { AdminOnly, Auditable } from '../../../common/decorators';
import { AUDIT_ACTIONS } from '@app/shared';

@Controller('crop-categories')
export class CropCategoryController {
  constructor(private readonly service: CropCategoryService) {}

  @AdminOnly()
  @Auditable(AUDIT_ACTIONS.CROP_CREATED, { entityType: 'CropCategory' })
  @Post()
  create(@Body() dto: CreateCropCategoryDto) {
    return this.service.create(dto);
  }

  @Get()
  list(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.list({ status, page, limit });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @AdminOnly()
  @Auditable(AUDIT_ACTIONS.CROP_UPDATED, { entityType: 'CropCategory', entityIdParam: 'id' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCropCategoryDto) {
    return this.service.update(id, dto);
  }

  @AdminOnly()
  @Auditable(AUDIT_ACTIONS.CROP_DELETED, { entityType: 'CropCategory', entityIdParam: 'id' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
