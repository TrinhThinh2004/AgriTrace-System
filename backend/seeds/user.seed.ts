import * as bcrypt from 'bcrypt';
import { User } from '../apps/user-service/src/entities/user.entity';
import { UserProfile } from '../apps/user-service/src/entities/user-profile.entity';
import { UserKey } from '../apps/user-service/src/entities/user-key.entity';
import { Role, UserStatus } from '@app/shared';
import {
  createDataSource,
  isFresh,
  ADMIN_USER_ID,
  FARMER_1_ID,
  FARMER_2_ID,
  FARMER_3_ID,
  INSPECTOR_1_ID,
  INSPECTOR_2_ID,
} from './constants';
import { env } from 'process';
export async function seedUsers() {
  const ds = createDataSource('user', [User, UserProfile, UserKey]);
  await ds.initialize();

  const userRepo = ds.getRepository(User);
  const profileRepo = ds.getRepository(UserProfile);

  if (isFresh) {
    await profileRepo.delete({});
    await ds.getRepository(UserKey).delete({});
    await userRepo.delete({});
    console.log('  Đã xóa dữ liệu bảng người dùng');
  }

  // Hash password
  const adminPasswordHash = await bcrypt.hash(env.Adminpassword!, 10);
  const passwordHash = await bcrypt.hash(env.userpassword!, 10);

  const users = [
    {
      id: ADMIN_USER_ID,
      email: 'admin@gmail.com',
      password_hash: adminPasswordHash,
      full_name: 'Nguyen Van Admin',
      phone: '0901000001',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    {
      id: FARMER_1_ID,
      email: 'fammer1@gmail.com',
      password_hash: passwordHash,
      full_name: 'Tran Thi Lan',
      phone: '0901000002',
      role: Role.FARMER,
      status: UserStatus.ACTIVE,
    },
    {
      id: FARMER_2_ID,
      email: 'fammer2@gmail.com',
      password_hash: passwordHash,
      full_name: 'Le Van Hai',
      phone: '0901000003',
      role: Role.FARMER,
      status: UserStatus.ACTIVE,
    },
    {
      id: FARMER_3_ID,
      email: 'fammer3@gmail.com',
      password_hash: passwordHash,
      full_name: 'Pham Minh Duc',
      phone: '0901000004',
      role: Role.FARMER,
      status: UserStatus.ACTIVE,
    },
    {
      id: INSPECTOR_1_ID,
      email: 'inspector1@gmail.com',
      password_hash: passwordHash,
      full_name: 'Vo Thi Mai',
      phone: '0901000005',
      role: Role.INSPECTOR,
      status: UserStatus.ACTIVE,
    },
    {
      id: INSPECTOR_2_ID,
      email: 'inspector2@gmail.com',
      password_hash: passwordHash,
      full_name: 'Hoang Duc Anh',
      phone: '0901000006',
      role: Role.INSPECTOR,
      status: UserStatus.ACTIVE,
    },
  ];

  await userRepo.upsert(users, ['id']);
  console.log(`  Đã thêm ${users.length} người dùng`);

  const profiles = [
    {
      user_id: ADMIN_USER_ID,
      address: 'Hà Nội',
      bio: 'Quản trị viên hệ thống AgriTrace',
    },
    {
      user_id: FARMER_1_ID,
      farm_name: 'Nông trại Sen Vàng',
      farm_location: 'Lâm Đồng',
      address: 'Xuân Trường, Đà Lạt, Lâm Đồng',
      certifications: [
        { type: 'VietGAP', issued: '2024-06-01', expires: '2027-06-01' },
      ],
      bio: 'Nông dân chuyên canh tác rau sạch và hoa tại Đà Lạt với 10 năm kinh nghiệm',
    },
    {
      user_id: FARMER_2_ID,
      farm_name: 'Trang trại Cà phê Đắk Lắk',
      farm_location: 'Đắk Lắk',
      address: 'Buôn Ma Thuột, Đắk Lắk',
      certifications: [
        { type: 'Organic', issued: '2023-12-15', expires: '2026-12-15' },
      ],
      bio: 'Chuyên gia cà phê Robusta vùng Tây Nguyên, áp dụng phương pháp hữu cơ',
    },
    {
      user_id: FARMER_3_ID,
      farm_name: 'Nông trại Rau An Giang',
      farm_location: 'An Giang',
      address: 'Long Xuyên, An Giang',
      certifications: [],
      bio: 'Nông dân miền Tây, canh tác lúa và cây ăn trái',
    },
    {
      user_id: INSPECTOR_1_ID,
      address: 'Thủ Đức, TP. Hồ Chí Minh',
      bio: 'Thanh tra chất lượng nông sản, chuyên gia VietGAP và GlobalGAP với 8 năm kinh nghiệm',
    },
    {
      user_id: INSPECTOR_2_ID,
      address: 'Bình Thạnh, TP. Hồ Chí Minh',
      bio: 'Kỹ sư nông nghiệp, chuyên kiểm định an toàn thực phẩm và chứng nhận hữu cơ',
    },
  ];

  // Upsert profiles — check tồn tại trước vì user_id là unique
  for (const p of profiles) {
    const existing = await profileRepo.findOneBy({ user_id: p.user_id });
    if (existing) {
      await profileRepo.update(existing.id, p);
    } else {
      await profileRepo.save(profileRepo.create(p));
    }
  }
  console.log(`  Đã thêm ${profiles.length} hồ sơ người dùng`);

  await ds.destroy();
}

// Cho phép chạy riêng: ts-node seeds/user.seed.ts
if (require.main === module) {
  seedUsers()
    .then(() => console.log('User seed done!'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
