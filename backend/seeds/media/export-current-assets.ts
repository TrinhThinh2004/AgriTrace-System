import * as fs from 'fs';
import * as path from 'path';
import { IsNull } from 'typeorm';
import { Asset } from '../../apps/media-service/src/entities/asset.entity';
import { createDataSource } from '../constants';

async function main() {
  const ds = createDataSource('media', [Asset]);
  await ds.initialize();

  const repo = ds.getRepository(Asset);
  const rows = await repo.find({ where: { deleted_at: IsNull() } });

  const manifest = rows.map((r) => ({
    id: r.id,
    owner_id: r.owner_id,
    ref_type: r.ref_type,
    ref_id: r.ref_id,
    cloudinary_public_id: r.cloudinary_public_id,
    url: r.url,
    secure_url: r.secure_url,
    mime: r.mime,
    bytes: Number(r.bytes),
    width: r.width,
    height: r.height,
    original_filename: r.original_filename,
  }));

  const outPath = path.resolve(__dirname, 'demo-assets.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Exported ${manifest.length} assets -> ${outPath}`);

  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
