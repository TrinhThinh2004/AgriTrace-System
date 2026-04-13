import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ========================
// Deterministic UUIDs — dùng chung giữa các service
// ========================

// Users
export const ADMIN_USER_ID = 'a0000000-0000-0000-0000-000000000001';
export const FARMER_1_ID = 'f0000000-0000-0000-0000-000000000001';
export const FARMER_2_ID = 'f0000000-0000-0000-0000-000000000002';
export const FARMER_3_ID = 'f0000000-0000-0000-0000-000000000003';
export const INSPECTOR_1_ID = 'e0000000-0000-0000-0000-000000000001';
export const INSPECTOR_2_ID = 'e0000000-0000-0000-0000-000000000002';

// Crop Categories
export const CROP_LUA_ID = 'cc000000-0000-0000-0000-000000000001';
export const CROP_CAPHE_ID = 'cc000000-0000-0000-0000-000000000002';
export const CROP_TIEU_ID = 'cc000000-0000-0000-0000-000000000003';
export const CROP_THANHLONG_ID = 'cc000000-0000-0000-0000-000000000004';
export const CROP_RAU_ID = 'cc000000-0000-0000-0000-000000000005';
export const CROP_XOAI_ID = 'cc000000-0000-0000-0000-000000000006';

// Farms
export const FARM_1_ID = 'fa000000-0000-0000-0000-000000000001';
export const FARM_2_ID = 'fa000000-0000-0000-0000-000000000002';
export const FARM_3_ID = 'fa000000-0000-0000-0000-000000000003';
export const FARM_4_ID = 'fa000000-0000-0000-0000-000000000004';

// Batches
export const BATCH_1_ID = 'b0000000-0000-0000-0000-000000000001';
export const BATCH_2_ID = 'b0000000-0000-0000-0000-000000000002';
export const BATCH_3_ID = 'b0000000-0000-0000-0000-000000000003';
export const BATCH_4_ID = 'b0000000-0000-0000-0000-000000000004';
export const BATCH_5_ID = 'b0000000-0000-0000-0000-000000000005';
export const BATCH_6_ID = 'b0000000-0000-0000-0000-000000000006';
export const BATCH_7_ID = 'b0000000-0000-0000-0000-000000000007';
export const BATCH_8_ID = 'b0000000-0000-0000-0000-000000000008';

// Datasource configs
const DB_CONFIGS = {
  user: {
    host: 'USER_DB_HOST',
    port: 'USER_DB_PORT',
    user: 'USER_DB_USER',
    pass: 'USER_DB_PASS',
    name: 'USER_DB_NAME',
  },
  product: {
    host: 'PRODUCT_DB_HOST',
    port: 'PRODUCT_DB_PORT',
    user: 'PRODUCT_DB_USER',
    pass: 'PRODUCT_DB_PASS',
    name: 'PRODUCT_DB_NAME',
  },
  trace: {
    host: 'TRACE_DB_HOST',
    port: 'TRACE_DB_PORT',
    user: 'TRACE_DB_USER',
    pass: 'TRACE_DB_PASS',
    name: 'TRACE_DB_NAME',
  },
};

export function createDataSource(
  service: keyof typeof DB_CONFIGS,
  entities: Function[],
): DataSource {
  const c = DB_CONFIGS[service];
  return new DataSource({
    type: 'postgres',
    host: process.env[c.host] || 'localhost',
    port: parseInt(process.env[c.port] || '5432', 10),
    username: process.env[c.user],
    password: process.env[c.pass],
    database: process.env[c.name],
    entities,
    synchronize: true,
  });
}

export const isFresh = process.argv.includes('--fresh');
