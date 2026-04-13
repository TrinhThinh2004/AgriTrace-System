import { ActivityLog } from '../apps/trace-service/src/entities/activity-log.entity';
import { Inspection } from '../apps/trace-service/src/entities/inspection.entity';
import { ActivityType, InspectionType, InspectionResult } from '@app/shared';
import {
  createDataSource,
  isFresh,
  FARMER_1_ID,
  FARMER_2_ID,
  FARMER_3_ID,
  INSPECTOR_1_ID,
  INSPECTOR_2_ID,
  BATCH_1_ID,
  BATCH_2_ID,
  BATCH_3_ID,
  BATCH_4_ID,
  BATCH_5_ID,
  BATCH_6_ID,
} from './constants';

export async function seedTraces() {
  const ds = createDataSource('trace', [ActivityLog, Inspection]);
  await ds.initialize();

  const activityRepo = ds.getRepository(ActivityLog);
  const inspectionRepo = ds.getRepository(Inspection);

  if (isFresh) {
    await inspectionRepo.delete({});
    await activityRepo.delete({});
    console.log('  Đã xóa dữ liệu bảng truy vết');
  }

  // ── Activity Logs ──
  const activities: Partial<ActivityLog>[] = [
    // BATCH 1 (RAU - SHIPPED) — full lifecycle
    {
      batch_id: BATCH_1_ID,
      activity_type: ActivityType.SEEDING,
      performed_by: FARMER_1_ID,
      performed_at: new Date('2025-01-15'),
      location: 'Nhà kính A1, Nông trại Sen Vàng',
      notes: 'Gieo hạt xà lách Lolo xanh, mật độ 15cm x 20cm',
      inputs_used: [{ name: 'Hat giong Lolo xanh', quantity: 2, unit: 'kg' }],
    },
    {
      batch_id: BATCH_1_ID,
      activity_type: ActivityType.FERTILIZING,
      performed_by: FARMER_1_ID,
      performed_at: new Date('2025-01-25'),
      location: 'Nhà kính A1, Nông trại Sen Vàng',
      notes: 'Bón phân hữu cơ lần 1',
      inputs_used: [
        { name: 'Phan huu co vi sinh', quantity: 100, unit: 'kg' },
      ],
    },
    {
      batch_id: BATCH_1_ID,
      activity_type: ActivityType.WATERING,
      performed_by: FARMER_1_ID,
      performed_at: new Date('2025-02-05'),
      location: 'Nhà kính A1, Nông trại Sen Vàng',
      notes: 'Tưới nhỏ giọt tự động, 2 lần/ngày',
      inputs_used: [],
    },
    {
      batch_id: BATCH_1_ID,
      activity_type: ActivityType.SPRAYING,
      performed_by: FARMER_1_ID,
      performed_at: new Date('2025-02-15'),
      location: 'Nhà kính A1, Nông trại Sen Vàng',
      notes: 'Phun thuốc trừ sâu sinh học phòng ngừa',
      inputs_used: [
        { name: 'Thuoc tru sau sinh hoc BT', quantity: 1, unit: 'lit' },
      ],
    },
    {
      batch_id: BATCH_1_ID,
      activity_type: ActivityType.HARVESTING,
      performed_by: FARMER_1_ID,
      performed_at: new Date('2025-03-12'),
      location: 'Nhà kính A1, Nông trại Sen Vàng',
      notes: 'Thu hoạch đợt 1, đạt 1200kg',
      inputs_used: [],
    },
    {
      batch_id: BATCH_1_ID,
      activity_type: ActivityType.PACKING,
      performed_by: FARMER_1_ID,
      performed_at: new Date('2025-03-13'),
      location: 'Kho đóng gói, Nông trại Sen Vàng',
      notes: 'Đóng gói túi 500g, dán nhãn QR',
      inputs_used: [
        { name: 'Tui dong goi 500g', quantity: 2400, unit: 'cai' },
      ],
    },

    // BATCH 2 (CA PHE - PACKED)
    {
      batch_id: BATCH_2_ID,
      activity_type: ActivityType.SEEDING,
      performed_by: FARMER_2_ID,
      performed_at: new Date('2024-04-01'),
      location: 'Lô A, Trang trại Cà phê Đắk Lắk',
      notes: 'Trồng cây giống cà phê Robusta TR4',
      inputs_used: [
        { name: 'Cay giong Robusta TR4', quantity: 1200, unit: 'cay' },
      ],
    },
    {
      batch_id: BATCH_2_ID,
      activity_type: ActivityType.FERTILIZING,
      performed_by: FARMER_2_ID,
      performed_at: new Date('2024-07-15'),
      location: 'Lô A, Trang trại Cà phê Đắk Lắk',
      notes: 'Bón phân NPK lần 2',
      inputs_used: [
        { name: 'Phan NPK 16-16-8', quantity: 200, unit: 'kg' },
        { name: 'Phan huu co', quantity: 500, unit: 'kg' },
      ],
    },
    {
      batch_id: BATCH_2_ID,
      activity_type: ActivityType.HARVESTING,
      performed_by: FARMER_2_ID,
      performed_at: new Date('2025-01-20'),
      location: 'Lô A, Trang trại Cà phê Đắk Lắk',
      notes: 'Thu hoạch cà phê chín đỏ, phương pháp hái chọn lọc',
      inputs_used: [],
    },
    {
      batch_id: BATCH_2_ID,
      activity_type: ActivityType.PACKING,
      performed_by: FARMER_2_ID,
      performed_at: new Date('2025-02-10'),
      location: 'Xưởng chế biến, Trang trại Cà phê Đắk Lắk',
      notes: 'Sấy khô, đóng gói bao 60kg xuất khẩu',
      inputs_used: [{ name: 'Bao dung 60kg', quantity: 142, unit: 'cai' }],
    },

    // BATCH 3 (LUA - INSPECTED)
    {
      batch_id: BATCH_3_ID,
      activity_type: ActivityType.SEEDING,
      performed_by: FARMER_3_ID,
      performed_at: new Date('2024-11-20'),
      location: 'Ruộng A, Nông trại Rau An Giang',
      notes: 'Sạ mạ lúa ST25',
      inputs_used: [{ name: 'Giong lua ST25', quantity: 80, unit: 'kg' }],
    },
    {
      batch_id: BATCH_3_ID,
      activity_type: ActivityType.FERTILIZING,
      performed_by: FARMER_3_ID,
      performed_at: new Date('2025-01-10'),
      location: 'Ruộng A, Nông trại Rau An Giang',
      notes: 'Bón phân đợt 2, giai đoạn làm đòng',
      inputs_used: [
        { name: 'Phan Ure', quantity: 100, unit: 'kg' },
        { name: 'Phan Kali', quantity: 50, unit: 'kg' },
      ],
    },
    {
      batch_id: BATCH_3_ID,
      activity_type: ActivityType.HARVESTING,
      performed_by: FARMER_3_ID,
      performed_at: new Date('2025-03-18'),
      location: 'Ruộng A, Nông trại Rau An Giang',
      notes: 'Thu hoạch bằng máy gặt đập liên hợp',
      inputs_used: [],
    },

    // BATCH 4 (XOAI - HARVESTED)
    {
      batch_id: BATCH_4_ID,
      activity_type: ActivityType.SEEDING,
      performed_by: FARMER_3_ID,
      performed_at: new Date('2024-12-01'),
      location: 'Vườn xoài Đồng Tháp',
      notes: 'Xử lý ra hoa xoài cát Hòa Lộc',
      inputs_used: [
        { name: 'Paclobutrazol', quantity: 5, unit: 'kg' },
        { name: 'KNO3', quantity: 10, unit: 'kg' },
      ],
    },
    {
      batch_id: BATCH_4_ID,
      activity_type: ActivityType.HARVESTING,
      performed_by: FARMER_3_ID,
      performed_at: new Date('2025-04-25'),
      location: 'Vườn xoài Đồng Tháp',
      notes: 'Thu hoạch xoài chín 80%, bỏ túi bảo quả',
      inputs_used: [],
    },

    // BATCH 5 (RAU - GROWING)
    {
      batch_id: BATCH_5_ID,
      activity_type: ActivityType.SEEDING,
      performed_by: FARMER_1_ID,
      performed_at: new Date('2025-03-01'),
      location: 'Nhà kính B2, Nông trại Sen Vàng',
      notes: 'Trồng cà chua beef giống Savior',
      inputs_used: [
        { name: 'Cay giong ca chua Savior', quantity: 500, unit: 'cay' },
      ],
    },
    {
      batch_id: BATCH_5_ID,
      activity_type: ActivityType.FERTILIZING,
      performed_by: FARMER_1_ID,
      performed_at: new Date('2025-03-20'),
      location: 'Nhà kính B2, Nông trại Sen Vàng',
      notes: 'Bón lót phân hữu cơ + vi sinh',
      inputs_used: [
        { name: 'Phan huu co Trimix', quantity: 50, unit: 'kg' },
      ],
    },

    // BATCH 6 (TIEU - GROWING)
    {
      batch_id: BATCH_6_ID,
      activity_type: ActivityType.SEEDING,
      performed_by: FARMER_2_ID,
      performed_at: new Date('2025-02-10'),
      location: 'Lô B, Trang trại Cà phê Đắk Lắk',
      notes: 'Trồng tiêu giống Vinh Linh xen canh cà phê',
      inputs_used: [
        { name: 'Hom tieu Vinh Linh', quantity: 600, unit: 'hom' },
      ],
    },
  ];

  // Insert — skip duplicates nếu đã tồn tại
  for (const a of activities) {
    const existing = await activityRepo.findOneBy({
      batch_id: a.batch_id,
      activity_type: a.activity_type,
      performed_at: a.performed_at,
    });
    if (!existing) {
      await activityRepo.save(activityRepo.create(a));
    }
  }
  console.log(`  Đã thêm ${activities.length} nhật ký hoạt động`);

  // ── Inspections ──
  const inspections: any[] = [
    // BATCH 1 (SHIPPED) — passed all inspections
    {
      batch_id: BATCH_1_ID,
      inspector_id: INSPECTOR_1_ID,
      inspection_type: InspectionType.FIELD_VISIT,
      result: InspectionResult.PASS,
      scheduled_at: new Date('2025-03-01'),
      conducted_at: new Date('2025-03-02'),
      notes: 'Rau phát triển tốt, không có dấu hiệu sâu bệnh. Đạt tiêu chuẩn VietGAP.',
    },
    {
      batch_id: BATCH_1_ID,
      inspector_id: INSPECTOR_2_ID,
      inspection_type: InspectionType.LAB_TEST,
      result: InspectionResult.PASS,
      scheduled_at: new Date('2025-03-10'),
      conducted_at: new Date('2025-03-11'),
      notes: 'Kết quả xét nghiệm dư lượng thuốc BVTV: đạt chuẩn. Không phát hiện kim loại nặng.',
    },
    {
      batch_id: BATCH_1_ID,
      inspector_id: INSPECTOR_1_ID,
      inspection_type: InspectionType.FINAL_CERTIFICATION,
      result: InspectionResult.PASS,
      scheduled_at: new Date('2025-03-12'),
      conducted_at: new Date('2025-03-12'),
      notes: 'Cấp chứng nhận VietGAP cho lô hàng. Đủ điều kiện xuất bán.',
    },

    // BATCH 3 (INSPECTED)
    {
      batch_id: BATCH_3_ID,
      inspector_id: INSPECTOR_1_ID,
      inspection_type: InspectionType.FIELD_VISIT,
      result: InspectionResult.PASS,
      scheduled_at: new Date('2025-03-15'),
      conducted_at: new Date('2025-03-16'),
      notes: 'Ruộng lúa sạch, không sử dụng thuốc cấm. Quy trình canh tác đúng kỹ thuật.',
    },
    {
      batch_id: BATCH_3_ID,
      inspector_id: INSPECTOR_2_ID,
      inspection_type: InspectionType.DOCUMENT_REVIEW,
      result: InspectionResult.CONDITIONAL_PASS,
      scheduled_at: new Date('2025-03-20'),
      conducted_at: new Date('2025-03-21'),
      notes: 'Hồ sơ canh tác đầy đủ. Cần bổ sung giấy chứng nhận nguồn nước tưới.',
    },

    // BATCH 2 (PACKED) — pending inspection
    {
      batch_id: BATCH_2_ID,
      inspector_id: INSPECTOR_2_ID,
      inspection_type: InspectionType.LAB_TEST,
      result: InspectionResult.PENDING,
      scheduled_at: new Date('2025-04-15'),
      conducted_at: null,
      notes: 'Chờ kết quả xét nghiệm caffeine và độ ẩm hạt cà phê.',
    },
  ];

  for (const ins of inspections) {
    const existing = await inspectionRepo.findOneBy({
      batch_id: ins.batch_id,
      inspection_type: ins.inspection_type,
      inspector_id: ins.inspector_id,
    });
    if (!existing) {
      await inspectionRepo.save(inspectionRepo.create(ins));
    }
  }
  console.log(`  Seeded ${inspections.length} inspections`);

  await ds.destroy();
}

if (require.main === module) {
  seedTraces()
    .then(() => console.log('Trace seed done!'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
