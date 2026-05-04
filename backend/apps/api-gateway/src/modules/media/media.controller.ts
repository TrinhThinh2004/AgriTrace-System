import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { CurrentUser, Auditable } from '../../common/decorators';
import { AUDIT_ACTIONS } from '@app/shared';

type MulterFile = Express.Multer.File;

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Auditable(AUDIT_ACTIONS.MEDIA_UPLOADED, { entityType: 'Media' })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_BYTES })
        .build({ fileIsRequired: true }),
    )
    file: MulterFile,
    @CurrentUser('id') userId: string,
    @Query('ref_type') refTypeQuery?: string,
    @Query('ref_id') refIdQuery?: string,
  ) {
    const refType = refTypeQuery;
    if (!refType) throw new BadRequestException('ref_type is required');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported mime ${file.mimetype}. Allowed: ${ALLOWED_MIME.join(', ')}`,
      );
    }

    const result = await this.media.upload({
      owner_id: userId,
      ref_type: refType,
      ref_id: refIdQuery,
      mime: file.mimetype,
      file_bytes: file.buffer,
      original_filename: file.originalname,
    });
    return result.asset;
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const r = await this.media.get(id);
    return r.asset;
  }

  @Get()
  async list(
    @Query('ref_type') ref_type?: string,
    @Query('ref_id') ref_id?: string,
    @Query('owner_id') owner_id?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.media.list({
      ref_type,
      ref_id,
      owner_id,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Auditable(AUDIT_ACTIONS.MEDIA_DELETED, { entityType: 'Media', entityIdParam: 'id' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.media.delete(id, userId, (role || '').toUpperCase() === 'ADMIN');
  }
}
