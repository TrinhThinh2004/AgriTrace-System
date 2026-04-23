import { seedUsers } from './user.seed';
import { seedProducts } from './product.seed';
import { seedTraces } from './trace.seed';
import { seedAssets } from './asset.seed';

async function main() {
  console.log('=== AgriTrace Database Seeding ===');
  console.log(`Chế độ: ${process.argv.includes('--fresh') ? 'FRESH (xóa dữ liệu cũ)' : 'UPSERT (giữ dữ liệu cũ)'}\n`);

  console.log('[1/4] Seeding user-service database...');
  await seedUsers();

  console.log('\n[2/4] Seeding product-service database...');
  await seedProducts();

  console.log('\n[3/4] Seeding trace-service database...');
  await seedTraces();

  console.log('\n[4/4] Seeding media-service database...');
  await seedAssets();

  console.log('\n=== Seeding hoan tat! ===');
}

main().catch((err) => {
  console.error('Seeding that bai:', err);
  process.exit(1);
});
