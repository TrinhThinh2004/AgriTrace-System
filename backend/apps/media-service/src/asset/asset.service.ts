import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Asset, AssetRefType } from '../entities/asset.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

export interface UploadInput {
  owner_id: string;
  ref_type: string;
  ref_id?: string;
  mime: string;
  file_bytes: Buffer;
  original_filename?: string;
}

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset) private readonly repo: Repository<Asset>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async upload(input: UploadInput): Promise<Asset> {
    if (!input.file_bytes || input.file_bytes.length === 0) {
      throw new BadRequestException('Empty file');
    }
    const refType = this.parseRefType(input.ref_type);
    const refIdSegment = input.ref_id || 'unassigned';
    const folder = `agritrace/${refType.toLowerCase()}/${refIdSegment}`;

    const result = await this.cloudinary.upload(input.file_bytes, folder);

    const asset = this.repo.create({
      owner_id: input.owner_id,
      ref_type: refType,
      ref_id: input.ref_id || null,
      cloudinary_public_id: result.public_id,
      url: result.url,
      secure_url: result.secure_url,
      mime: input.mime || `image/${result.format}`,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      original_filename: input.original_filename || null,
    });
    return this.repo.save(asset);
  }

  async getById(id: string): Promise<Asset> {
    const asset = await this.repo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async list(params: {
    ref_type?: string;
    ref_id?: string;
    owner_id?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const where: any = {};
    if (params.ref_type) where.ref_type = this.parseRefType(params.ref_type);
    if (params.ref_id) where.ref_id = params.ref_id;
    if (params.owner_id) where.owner_id = params.owner_id;

    const [assets, total] = await this.repo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { assets, total, page, limit };
  }

  async delete(id: string, requesterId: string, isAdmin: boolean): Promise<void> {
    const asset = await this.getById(id);
    if (!isAdmin && asset.owner_id !== requesterId) {
      throw new ForbiddenException('Not allowed to delete this asset');
    }
    try {
      await this.cloudinary.destroy(asset.cloudinary_public_id);
    } catch (err) {
      // Log nhưng vẫn soft-delete row để metadata không lệch — Cloudinary có thể đã xoá hoặc lỗi mạng tạm.
      console.error('[Media Service] Cloudinary destroy error:', err);
    }
    await this.repo.softDelete(id);
  }

  private parseRefType(value: string): AssetRefType {
    const upper = (value || '').toUpperCase();
    if (!(upper in AssetRefType)) {
      throw new BadRequestException(
        `Invalid ref_type "${value}". Allowed: ${Object.keys(AssetRefType).join(', ')}`,
      );
    }
    return upper as AssetRefType;
  }
}
