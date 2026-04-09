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
import { AdminOnly } from '../../../common/decorators';

@Controller('crop-categories')
export class CropCategoryController {
  constructor(private readonly service: CropCategoryService) {}

  @AdminOnly()
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
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCropCategoryDto) {
    return this.service.update(id, dto);
  }

  @AdminOnly()
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
