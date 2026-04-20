import { Inject, Injectable } from '@nestjs/common';
import { v2 as cloudinaryType, UploadApiResponse } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.constants';

export interface UploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

@Injectable()
export class CloudinaryService {
  constructor(@Inject(CLOUDINARY) private readonly cloud: typeof cloudinaryType) {}
  // hàm upload nhận vào buffer, folder và publicIdHint (tùy chọn) để upload ảnh lên Cloudinary
  async upload(buffer: Buffer, folder: string, publicIdHint?: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = this.cloud.uploader.upload_stream(
        {
          folder,
          public_id: publicIdHint,
          resource_type: 'image',
          overwrite: true,
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'));
          const r = result as UploadApiResponse;
          resolve({
            public_id: r.public_id,
            url: r.url,
            secure_url: r.secure_url,
            bytes: r.bytes,
            width: r.width,
            height: r.height,
            format: r.format,
            resource_type: r.resource_type,
          });
        },
      );
      stream.end(buffer);
    });
  }

  async destroy(publicId: string): Promise<void> {
    await this.cloud.uploader.destroy(publicId, { resource_type: 'image' });
  }
}
