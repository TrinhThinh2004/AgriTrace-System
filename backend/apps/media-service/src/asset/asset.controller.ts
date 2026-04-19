import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AssetService } from './asset.service';
import { Asset } from '../entities/asset.entity';

function mapAsset(a: Asset) {
  return {
    id: a.id,
    owner_id: a.owner_id,
    ref_type: a.ref_type,
    ref_id: a.ref_id || '',
    cloudinary_public_id: a.cloudinary_public_id,
    url: a.url,
    secure_url: a.secure_url,
    mime: a.mime,
    bytes: Number(a.bytes),
    width: a.width,
    height: a.height,
    original_filename: a.original_filename || '',
    created_at: a.created_at?.toISOString?.() ?? '',
  };
}

@Controller()
export class AssetController {
  constructor(private readonly service: AssetService) {}

  @GrpcMethod('MediaService', 'UploadAsset')
  async uploadAsset(data: {
    owner_id: string;
    ref_type: string;
    ref_id?: string;
    mime: string;
    file_bytes: Buffer;
    original_filename?: string;
  }) {
    const asset = await this.service.upload({
      owner_id: data.owner_id,
      ref_type: data.ref_type,
      ref_id: data.ref_id,
      mime: data.mime,
      file_bytes: Buffer.isBuffer(data.file_bytes)
        ? data.file_bytes
        : Buffer.from(data.file_bytes as any),
      original_filename: data.original_filename,
    });
    return { asset: mapAsset(asset) };
  }

  @GrpcMethod('MediaService', 'GetAsset')
  async getAsset(data: { id: string }) {
    const asset = await this.service.getById(data.id);
    return { asset: mapAsset(asset) };
  }

  @GrpcMethod('MediaService', 'ListAssets')
  async listAssets(data: {
    ref_type?: string;
    ref_id?: string;
    owner_id?: string;
    page?: number;
    limit?: number;
  }) {
    const result = await this.service.list(data);
    return {
      assets: result.assets.map(mapAsset),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @GrpcMethod('MediaService', 'DeleteAsset')
  async deleteAsset(data: { id: string; requester_id: string; is_admin: boolean }) {
    await this.service.delete(data.id, data.requester_id, !!data.is_admin);
    return { message: 'Asset deleted' };
  }
}
