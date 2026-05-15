import { CertificationStatus } from '@app/shared';
import { CertificationTemplate } from '../apps/product-service/src/entities/certification-template.entity';
import { ChecklistItem } from '../apps/product-service/src/entities/checklist-item.entity';
import { ChecklistResponse } from '../apps/product-service/src/entities/checklist-response.entity';
import { ChecklistResponseItem } from '../apps/product-service/src/entities/checklist-response-item.entity';
import { Farm } from '../apps/product-service/src/entities/farm.entity';
import { Batch } from '../apps/product-service/src/entities/batch.entity';
import { CropCategory } from '../apps/product-service/src/entities/crop-category.entity';
import { createDataSource, isFresh } from './constants';

const TEMPLATE_VIETGAP_VEG_ID = 'ce700000-0000-4000-8000-000000000001';
const TEMPLATE_GLOBALGAP_VEG_ID = 'ce700000-0000-4000-8000-000000000002';

const ITEMS: Array<{
  id: string;
  order: number;
  category: string;
  code: string;
  title: string;
  description: string;
  required: boolean;
  evidence_required: boolean;
}> = [
  {
    id: 'ce710000-0000-4000-8000-000000000001',
    order: 1,
    category: 'Đất trồng',
    code: 'SOIL_001',
    title: 'Đất không bị ô nhiễm hóa chất, kim loại nặng',
    description:
      'Vùng trồng không nằm gần khu công nghiệp, bãi rác, không có lịch sử nhiễm thuốc trừ sâu cấm.',
    required: true,
    evidence_required: false,
  },
  {
    id: 'ce710000-0000-4000-8000-000000000002',
    order: 2,
    category: 'Đất trồng',
    code: 'SOIL_002',
    title: 'Có phân tích đất gần nhất trong vòng 12 tháng',
    description: 'Có giấy phân tích pH, độ phì, kim loại nặng.',
    required: true,
    evidence_required: true,
  },
  {
    id: 'ce710000-0000-4000-8000-000000000003',
    order: 3,
    category: 'Nước tưới',
    code: 'WATER_001',
    title: 'Nguồn nước tưới sạch, không từ nước thải',
    description:
      'Nước giếng khoan, nước mặt từ sông hồ chưa ô nhiễm hoặc nước máy.',
    required: true,
    evidence_required: false,
  },
  {
    id: 'ce710000-0000-4000-8000-000000000004',
    order: 4,
    category: 'Nước tưới',
    code: 'WATER_002',
    title: 'Có kết quả kiểm nghiệm nước trong vòng 12 tháng',
    description: 'Có giấy xét nghiệm vi sinh, hoá học.',
    required: true,
    evidence_required: true,
  },
  {
    id: 'ce710000-0000-4000-8000-000000000005',
    order: 5,
    category: 'Phân bón & BVTV',
    code: 'INPUT_001',
    title: 'Sử dụng phân bón trong danh mục cho phép',
    description:
      'Không dùng phân tươi chưa ủ hoai. Phân bón mua từ nhà cung cấp có giấy phép.',
    required: true,
    evidence_required: false,
  },
  {
    id: 'ce710000-0000-4000-8000-000000000006',
    order: 6,
    category: 'Phân bón & BVTV',
    code: 'INPUT_002',
    title: 'Thuốc BVTV trong danh mục cho phép VietGAP',
    description:
      'Không dùng thuốc cấm. Có hoá đơn mua thuốc thể hiện rõ tên, liều lượng.',
    required: true,
    evidence_required: true,
  },
  {
    id: 'ce710000-0000-4000-8000-000000000007',
    order: 7,
    category: 'Phân bón & BVTV',
    code: 'INPUT_003',
    title: 'Đảm bảo thời gian cách ly trước thu hoạch',
    description: 'Tuân thủ thời gian cách ly ghi trên nhãn thuốc BVTV.',
    required: true,
    evidence_required: false,
  },
  {
    id: 'ce710000-0000-4000-8000-000000000008',
    order: 8,
    category: 'Thu hoạch',
    code: 'HARVEST_001',
    title: 'Dụng cụ thu hoạch sạch, không gỉ',
    description: 'Dụng cụ được vệ sinh, tránh tiếp xúc đất bẩn.',
    required: true,
    evidence_required: false,
  },
  {
    id: 'ce710000-0000-4000-8000-000000000009',
    order: 9,
    category: 'Thu hoạch',
    code: 'HARVEST_002',
    title: 'Kho lưu trữ tách biệt với khu phân bón / thuốc BVTV',
    description: 'Không để chung với hoá chất, có thông gió.',
    required: true,
    evidence_required: false,
  },
  {
    id: 'ce710000-0000-4000-8000-000000000010',
    order: 10,
    category: 'Ghi chép',
    code: 'RECORD_001',
    title: 'Có sổ nhật ký canh tác đầy đủ',
    description:
      'Ghi đầy đủ ngày bón phân, phun thuốc, thu hoạch. Lưu giữ ≥ 2 năm.',
    required: true,
    evidence_required: true,
  },
];

const GLOBALGAP_ITEMS: Array<{
  id: string;
  order: number;
  category: string;
  code: string;
  title: string;
  description: string;
  required: boolean;
  evidence_required: boolean;
}> = [
  {
    id: 'ce720000-0000-4000-8000-000000000001',
    order: 1,
    category: 'Truy xuất & vùng trồng',
    code: 'TRACE_001',
    title: 'Có sơ đồ vùng trồng + mã định danh từng lô',
    description:
      'Mỗi khu vực canh tác có mã riêng, sơ đồ rõ vị trí, diện tích, loại cây.',
    required: true,
    evidence_required: true,
  },
  {
    id: 'ce720000-0000-4000-8000-000000000002',
    order: 2,
    category: 'Đất & môi trường',
    code: 'SOIL_GG_001',
    title: 'Đánh giá rủi ro đất trồng (lịch sử sử dụng, ô nhiễm tiềm ẩn)',
    description:
      'Văn bản đánh giá rủi ro đất, có biện pháp xử lý nếu phát hiện rủi ro.',
    required: true,
    evidence_required: true,
  },
  {
    id: 'ce720000-0000-4000-8000-000000000003',
    order: 3,
    category: 'Nước tưới',
    code: 'WATER_GG_001',
    title: 'Phân tích nước tưới hàng năm theo tiêu chuẩn GlobalGAP',
    description:
      'Kiểm nghiệm vi sinh (E.coli) + kim loại nặng từ phòng thí nghiệm được công nhận.',
    required: true,
    evidence_required: true,
  },
  {
    id: 'ce720000-0000-4000-8000-000000000004',
    order: 4,
    category: 'Phân bón & BVTV',
    code: 'INPUT_GG_001',
    title: 'Chỉ dùng thuốc BVTV đăng ký tại quốc gia xuất khẩu đích',
    description:
      'Có danh sách thuốc được phép tại thị trường đích (EU/US/JP...). Lưu hồ sơ MRL.',
    required: true,
    evidence_required: true,
  },
  {
    id: 'ce720000-0000-4000-8000-000000000005',
    order: 5,
    category: 'Phân bón & BVTV',
    code: 'INPUT_GG_002',
    title: 'Người phun thuốc được đào tạo, có thiết bị bảo hộ',
    description:
      'Chứng chỉ đào tạo BVTV, ảnh thiết bị bảo hộ (PPE) đầy đủ.',
    required: true,
    evidence_required: true,
  },
  {
    id: 'ce720000-0000-4000-8000-000000000006',
    order: 6,
    category: 'Thu hoạch & sau thu hoạch',
    code: 'HARVEST_GG_001',
    title: 'Khu vực sơ chế đạt vệ sinh, có nước sạch rửa rau',
    description:
      'Nước rửa đạt tiêu chuẩn nước uống, dụng cụ sạch, tách biệt khu nhiễm bẩn.',
    required: true,
    evidence_required: true,
  },
  {
    id: 'ce720000-0000-4000-8000-000000000007',
    order: 7,
    category: 'An toàn lao động',
    code: 'LABOR_GG_001',
    title: 'Tuân thủ quy định lao động (không trẻ em, có hợp đồng)',
    description:
      'Lao động ≥ 15 tuổi, có hợp đồng, có khu nghỉ + nước uống + nhà vệ sinh.',
    required: true,
    evidence_required: false,
  },
  {
    id: 'ce720000-0000-4000-8000-000000000008',
    order: 8,
    category: 'Ghi chép & truy xuất',
    code: 'RECORD_GG_001',
    title: 'Hồ sơ truy xuất từ lô gieo đến lô xuất bán',
    description:
      'Mỗi lô có mã, ghi rõ ngày gieo, vật tư đầu vào, ngày thu hoạch, bên mua. Lưu ≥ 2 năm.',
    required: true,
    evidence_required: true,
  },
];

export async function seedCertification() {
  const ds = createDataSource('product', [
    Farm,
    Batch,
    CropCategory,
    CertificationTemplate,
    ChecklistItem,
    ChecklistResponse,
    ChecklistResponseItem,
  ]);
  await ds.initialize();

  const tplRepo = ds.getRepository(CertificationTemplate);
  const itemRepo = ds.getRepository(ChecklistItem);
  const respRepo = ds.getRepository(ChecklistResponse);
  const respItemRepo = ds.getRepository(ChecklistResponseItem);

  if (isFresh) {
    await respItemRepo.createQueryBuilder().delete().execute();
    await respRepo.createQueryBuilder().delete().execute();
    await itemRepo.createQueryBuilder().delete().execute();
    await tplRepo.createQueryBuilder().delete().execute();
    console.log('  Đã xóa dữ liệu certification cũ');
  }

  const vietgapTpl = {
    id: TEMPLATE_VIETGAP_VEG_ID,
    code: 'VIETGAP_VEGETABLE_V1',
    name: 'VietGAP - Rau ăn lá',
    cert_type: CertificationStatus.VIETGAP,
    version: 1,
    active: true,
    description:
      'Template VietGAP cho rau ăn lá (xà lách, cải, mồng tơi,...) gồm 10 tiêu chí cơ bản.',
  };
  const globalgapTpl = {
    id: TEMPLATE_GLOBALGAP_VEG_ID,
    code: 'GLOBALGAP_VEGETABLE_V1',
    name: 'GlobalGAP - Rau xuất khẩu',
    cert_type: CertificationStatus.GLOBALGAP,
    version: 1,
    active: true,
    description:
      'Template GlobalGAP cho rau xuất khẩu (EU/JP/US) gồm 8 tiêu chí trọng yếu: truy xuất, MRL, lao động.',
  };
  await tplRepo.upsert([vietgapTpl, globalgapTpl], ['id']);

  const vietgapItems = ITEMS.map((it) => ({
    ...it,
    template_id: TEMPLATE_VIETGAP_VEG_ID,
  }));
  const globalgapItems = GLOBALGAP_ITEMS.map((it) => ({
    ...it,
    template_id: TEMPLATE_GLOBALGAP_VEG_ID,
  }));
  await itemRepo.upsert([...vietgapItems, ...globalgapItems], ['id']);

  console.log(
    `  Đã thêm 2 template (${vietgapTpl.code}, ${globalgapTpl.code}) + ${vietgapItems.length + globalgapItems.length} tiêu chí`,
  );

  await ds.destroy();
}

if (require.main === module) {
  seedCertification()
    .then(() => console.log('Hoàn thành seed certification!'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
