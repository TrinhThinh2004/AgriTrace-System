import { Farm } from '../apps/product-service/src/entities/farm.entity';
import { Batch } from '../apps/product-service/src/entities/batch.entity';
import { CropCategory } from '../apps/product-service/src/entities/crop-category.entity';
import {
  BatchStatus,
  CertificationStatus,
  CropCategoryStatus,
  FarmStatus,
} from '@app/shared';
import {
  createDataSource,
  isFresh,
  FARMER_1_ID,
  FARMER_2_ID,
  FARMER_3_ID,
  CROP_LUA_ID,
  CROP_CAPHE_ID,
  CROP_TIEU_ID,
  CROP_THANHLONG_ID,
  CROP_RAU_ID,
  CROP_XOAI_ID,
  FARM_1_ID,
  FARM_2_ID,
  FARM_3_ID,
  FARM_4_ID,
  BATCH_1_ID,
  BATCH_2_ID,
  BATCH_3_ID,
  BATCH_4_ID,
  BATCH_5_ID,
  BATCH_6_ID,
  BATCH_7_ID,
  BATCH_8_ID,
} from './constants';

export async function seedProducts() {
  const ds = createDataSource('product', [Farm, Batch, CropCategory]);
  await ds.initialize();

  const cropRepo = ds.getRepository(CropCategory);
  const farmRepo = ds.getRepository(Farm);
  const batchRepo = ds.getRepository(Batch);

  if (isFresh) {
    await batchRepo.delete({});
    await farmRepo.delete({});
    await cropRepo.delete({});
    console.log('  Đã xóa dữ liệu bảng sản phẩm');
  }

  // ── Crop Categories ──
  const crops = [
    {
      id: CROP_LUA_ID,
      name: 'Gạo',
      description: 'Các giống gạo: ST25, Nang Thom, Jasmine',
      status: CropCategoryStatus.ACTIVE,
    },
    {
      id: CROP_CAPHE_ID,
      name: 'Cà phê',
      description: 'Cà phê Robusta và Arabica vùng Tây Nguyên',
      status: CropCategoryStatus.ACTIVE,
    },
    {
      id: CROP_TIEU_ID,
      name: 'Tiêu',
      description: 'Hồ tiêu đen và tiêu trắng Phú Quốc, Gia Lai',
      status: CropCategoryStatus.ACTIVE,
    },
    {
      id: CROP_THANHLONG_ID,
      name: 'Thanh Long',
      description: 'Thanh long ruot do va ruot trang Binh Thuan',
      status: CropCategoryStatus.ACTIVE,
    },
    {
      id: CROP_RAU_ID,
      name: 'Rau sạch',
      description: 'Rau an toàn Đà Lạt: xà lách, cà chua, ớt chuông',
      status: CropCategoryStatus.ACTIVE,
    },
    {
      id: CROP_XOAI_ID,
      name: 'Xoài',
      description: 'Xoài cát Hòa Lộc, xoài Đài Loan',
      status: CropCategoryStatus.ACTIVE,
    },
  ];

  await cropRepo.upsert(crops, ['id']);
  console.log(`  Đã thêm ${crops.length} loại cây trồng`);

  // ── Farms ──
  const farms = [
    {
      id: FARM_1_ID,
      owner_id: FARMER_1_ID,
      name: 'Nông trại Sen Vàng',
      address: 'Xuân Trường, Đà Lạt, Lâm Đồng',
      location_lat: 11.9404,
      location_long: 108.4583,
      area_hectares: 5.5,
      certification_status: CertificationStatus.VIETGAP,
      status: FarmStatus.ACTIVE,
    },
    {
      id: FARM_2_ID,
      owner_id: FARMER_2_ID,
      name: 'Trang trại Cà phê Đắk Lắk',
      address: 'Buôn Ma Thuột, Đắk Lắk',
      location_lat: 12.6667,
      location_long: 108.05,
      area_hectares: 12.0,
      certification_status: CertificationStatus.ORGANIC,
      status: FarmStatus.ACTIVE,
    },
    {
      id: FARM_3_ID,
      owner_id: FARMER_3_ID,
      name: 'Nông trại Rau An Giang',
      address: 'Long Xuyên, An Giang',
      location_lat: 10.3889,
      location_long: 105.4167,
      area_hectares: 3.2,
      certification_status: CertificationStatus.NONE,
      status: FarmStatus.ACTIVE,
    },
    {
      id: FARM_4_ID,
      owner_id: FARMER_3_ID,
      name: 'Vườn xoài Đồng Tháp',
      address: 'Cao Lãnh, Đồng Tháp',
      location_lat: 10.4667,
      location_long: 105.6333,
      area_hectares: 8.0,
      certification_status: CertificationStatus.GLOBALGAP,
      status: FarmStatus.ACTIVE,
    },
  ];

  await farmRepo.upsert(farms, ['id']);
  console.log(`  Đã thêm ${farms.length} trang trại`);

  // ── Batches ──
  const batches: any[] = [
    {
      id: BATCH_1_ID,
      batch_code: 'BATCH-RAU-2025-001',
      farm_id: FARM_1_ID,
      crop_category_id: CROP_RAU_ID,
      name: 'Xà lách Lolo xanh vụ Xuân 2025',
      status: BatchStatus.SHIPPED,
      planting_date: '2025-01-15',
      expected_harvest_date: '2025-03-15',
      actual_harvest_date: '2025-03-12',
      harvested_quantity: 1200,
      shipped_quantity: 1150,
      unit: 'kg',
      notes: 'Vụ thu hoạch tốt, đạt chuẩn VietGAP',
      created_by: FARMER_1_ID,
    },
    {
      id: BATCH_2_ID,
      batch_code: 'BATCH-CAPHE-2025-001',
      farm_id: FARM_2_ID,
      crop_category_id: CROP_CAPHE_ID,
      name: 'Cà phê Robusta vụ 2024-2025',
      status: BatchStatus.PACKED,
      planting_date: '2024-04-01',
      expected_harvest_date: '2025-01-15',
      actual_harvest_date: '2025-01-20',
      harvested_quantity: 8500,
      shipped_quantity: null,
      unit: 'kg',
      notes: 'Cà phê hữu cơ, sấy phương pháp ướt',
      created_by: FARMER_2_ID,
    },
    {
      id: BATCH_3_ID,
      batch_code: 'BATCH-LUA-2025-001',
      farm_id: FARM_3_ID,
      crop_category_id: CROP_LUA_ID,
      name: 'Lúa ST25 vụ Đông Xuân 2025',
      status: BatchStatus.INSPECTED,
      planting_date: '2024-11-20',
      expected_harvest_date: '2025-03-20',
      actual_harvest_date: '2025-03-18',
      harvested_quantity: 15000,
      shipped_quantity: null,
      unit: 'kg',
      notes: 'Giống ST25 chất lượng cao',
      created_by: FARMER_3_ID,
    },
    {
      id: BATCH_4_ID,
      batch_code: 'BATCH-XOAI-2025-001',
      farm_id: FARM_4_ID,
      crop_category_id: CROP_XOAI_ID,
      name: 'Xoài cát Hòa Lộc vụ 2025',
      status: BatchStatus.HARVESTED,
      planting_date: '2024-12-01',
      expected_harvest_date: '2025-04-30',
      actual_harvest_date: '2025-04-25',
      harvested_quantity: 5000,
      shipped_quantity: null,
      unit: 'kg',
      notes: 'Xoài đạt tiêu chuẩn xuất khẩu',
      created_by: FARMER_3_ID,
    },
    {
      id: BATCH_5_ID,
      batch_code: 'BATCH-RAU-2025-002',
      farm_id: FARM_1_ID,
      crop_category_id: CROP_RAU_ID,
      name: 'Cà chua beef Đà Lạt vụ Hè 2025',
      status: BatchStatus.GROWING,
      planting_date: '2025-03-01',
      expected_harvest_date: '2025-06-01',
      actual_harvest_date: null,
      harvested_quantity: null,
      shipped_quantity: null,
      unit: 'kg',
      notes: 'Trồng trong nhà kính, tưới nhỏ giọt',
      created_by: FARMER_1_ID,
    },
    {
      id: BATCH_6_ID,
      batch_code: 'BATCH-TIEU-2025-001',
      farm_id: FARM_2_ID,
      crop_category_id: CROP_TIEU_ID,
      name: 'Hồ tiêu đen Đắk Lắk 2025',
      status: BatchStatus.GROWING,
      planting_date: '2025-02-10',
      expected_harvest_date: '2025-08-10',
      actual_harvest_date: null,
      harvested_quantity: null,
      shipped_quantity: null,
      unit: 'kg',
      notes: 'Tiêu trồng xen với cà phê',
      created_by: FARMER_2_ID,
    },
    {
      id: BATCH_7_ID,
      batch_code: 'BATCH-THANHLONG-2025-001',
      farm_id: FARM_4_ID,
      crop_category_id: CROP_THANHLONG_ID,
      name: 'Thanh long ruột đỏ Đồng Tháp',
      status: BatchStatus.SEEDING,
      planting_date: '2025-04-01',
      expected_harvest_date: '2025-08-01',
      actual_harvest_date: null,
      harvested_quantity: null,
      shipped_quantity: null,
      unit: 'kg',
      notes: 'Giống thanh long ruột đỏ H14',
      created_by: FARMER_3_ID,
    },
    {
      id: BATCH_8_ID,
      batch_code: 'BATCH-LUA-2025-002',
      farm_id: FARM_3_ID,
      crop_category_id: CROP_LUA_ID,
      name: 'Lúa Nàng Thơm vụ Hè-Thu 2025',
      status: BatchStatus.SEEDING,
      planting_date: '2025-04-05',
      expected_harvest_date: '2025-07-15',
      actual_harvest_date: null,
      harvested_quantity: null,
      shipped_quantity: null,
      unit: 'kg',
      notes: 'Lúa Nàng Thơm cho thị trường nội địa',
      created_by: FARMER_3_ID,
    },
  ];

  await batchRepo.upsert(batches, ['id']);
  console.log(`  Đã thêm ${batches.length} lô hàng`);

  await ds.destroy();
}

if (require.main === module) {
  seedProducts()
    .then(() => console.log('Hoàn thành seed sản phẩm!'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
