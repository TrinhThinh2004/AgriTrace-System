import * as fs from 'fs';
import * as path from 'path';
import { Asset } from '../apps/media-service/src/entities/asset.entity';
import { createDataSource, isFresh } from './constants';

interface AssetManifestItem {
  id: string;
  owner_id: string;
  ref_type: string;
  ref_id: string | null;
  cloudinary_public_id: string;
  url: string;
  secure_url: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  original_filename: string | null;
}

export async function seedAssets() {
  const manifestPath = path.resolve(__dirname, 'media', 'demo-assets.json');
  if (!fs.existsSync(manifestPath)) {
    console.log('  Không tìm thấy demo-assets.json — bỏ qua seed assets.');
    console.log('  (Chạy: ts-node backend/seeds/media/export-current-assets.ts để tạo manifest từ DB hiện tại)');
    return;
  }

  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const items: AssetManifestItem[] = JSON.parse(raw);
  if (items.length === 0) {
    console.log('  demo-assets.json rỗng — bỏ qua seed assets.');
    return;
  }

  const ds = createDataSource('media', [Asset]);
  await ds.initialize();
  const repo = ds.getRepository(Asset);

  if (isFresh) {
    const res = await repo.delete({ is_seed: true });
    console.log(`  Đã xóa ${res.affected ?? 0} ảnh seed cũ (is_seed=true)`);
  }

  const rows = items.map((it) => ({
    ...it,
    ref_type: it.ref_type as any,
    is_seed: true,
  }));

  await repo.upsert(rows, ['id']);
  console.log(`  Đã thêm/cập nhật ${rows.length} ảnh seed`);

  await ds.destroy();
}

if (require.main === module) {
  seedAssets()
    .then(() => console.log('Asset seed done!'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
