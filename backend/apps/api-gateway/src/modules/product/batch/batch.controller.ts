import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { BatchService } from './batch.service';
import { CreateBatchDto, UpdateBatchDto, TransitionBatchDto } from './dto';
import { CurrentUser, Roles, OwnsBatch, FarmerOnly, Public } from '../../../common/decorators';
import { Role } from '../../../common/enums';

@Controller('batches')
export class BatchController {
  constructor(
    private readonly service: BatchService,
    private readonly configService: ConfigService,
  ) {}
  // Endpoint để tạo batch mới, chỉ farmer được phép tạo batch cho farm của họ
  @FarmerOnly()
  @Post()
  create(@Body() dto: CreateBatchDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }
  // Endpoint để lấy danh sách batches, farmer chỉ thấy batches của farm mình, admin/inspector thấy tất cả
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
  // Endpoint để lấy thông tin chi tiết của batch, chỉ owner (farmer) hoặc admin/inspector mới được xem
  @OwnsBatch('id')
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findById(id, user);
  }
  // Endpoint để cập nhật thông tin batch, chỉ owner (farmer) mới được phép chỉnh sửa
  @OwnsBatch('id')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBatchDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }
  // Endpoint để chuyển trạng thái batch
  @Roles(Role.ADMIN,Role.INSPECTOR, Role.FARMER)
  @OwnsBatch('id')
  @Post(':id/transition')
  transitionStatus(
    @Param('id') id: string,
    @Body() dto: TransitionBatchDto,
    @CurrentUser() user: any,
  ) {
    return this.service.transitionStatus(id, dto, user);
  }
  // Endpoint để xóa batch, chỉ owner (farmer) mới được phép xóa batch của mình
  @OwnsBatch('id')
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user);
  }

  @Public()
  @Get(':id/qr')
  async getQrCode(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    // Lấy batch_code từ batch (endpoint public)
    const batch = await this.service.findByIdPublic(id);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const traceUrl = `${frontendUrl}/trace/${batch.batch_code}`;

    const qrBuffer = await QRCode.toBuffer(traceUrl, {
      type: 'png',
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="qr-${batch.batch_code}.png"`,
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(qrBuffer);
  }
}
