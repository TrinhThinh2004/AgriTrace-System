import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../entities/batch.entity';
import { Farm } from '../entities/farm.entity';
import { CropCategory } from '../entities/crop-category.entity';
import { BatchStatus, CropCategoryStatus, Role } from '@app/shared';
import { isValidTransition, allowedNextStatuses } from './status-machine';

interface CallerCtx {
  userId: string | null;
  role: string | null;
}

interface CreateBatchInput {
  batch_code: string;
  farm_id: string;
  crop_category_id: string;
  name: string;
  planting_date?: string;
  expected_harvest_date?: string;
  unit?: string;
  notes?: string;
}

interface UpdateBatchInput {
  name?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  harvested_quantity?: string | number;
  shipped_quantity?: string | number;
  unit?: string;
  notes?: string;
}

interface TransitionInput {
  next_status: string;
  actual_harvest_date?: string;
  harvested_quantity?: string | number;
  shipped_quantity?: string | number;
}

interface ListParams {
  farm_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

function parseDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime()))
    throw new BadRequestException(`Ngày không hợp lệ: ${v}`);
  return d;
}

function parseNumber(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n))
    throw new BadRequestException(`Số không hợp lệ: ${v}`);
  if (n < 0) throw new BadRequestException(`Số phải >= 0: ${v}`);
  return n;
}
// Service chứa business logic, không phụ thuộc vào gRPC hay HTTP
@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    @InjectRepository(CropCategory)
    private readonly ccRepo: Repository<CropCategory>,
  ) {}
  // Method create 
  async create(input: CreateBatchInput, caller: CallerCtx) {
    if (!caller?.userId)
      throw new ForbiddenException('Thiếu thông tin caller');

    if (!input.batch_code?.trim())
      throw new BadRequestException('batch_code không được để trống');
    if (!input.name?.trim())
      throw new BadRequestException('Tên batch không được để trống');

    //  Kiểm tra farm tồn tại + ownership
    const farm = await this.farmRepo.findOne({
      where: { id: input.farm_id },
    });
    if (!farm) throw new NotFoundException(`Farm ${input.farm_id} không tìm thấy`);

    if (caller.role !== Role.ADMIN && farm.owner_id !== caller.userId) {
      throw new ForbiddenException('Bạn không sở hữu farm này');
    }

    // Kiểm tra crop category tồn tại + trạng thái (active)
    const cc = await this.ccRepo.findOne({
      where: { id: input.crop_category_id },
    });
    if (!cc)
      throw new NotFoundException(
        `Crop category ${input.crop_category_id} không tìm thấy`,
      );
    if (cc.status !== CropCategoryStatus.ACTIVE) {
      throw new BadRequestException(`Crop category "${cc.name}" đang INACTIVE`);
    }

    // Kiểm tra mã batch_code phải là duy nhất
    const dup = await this.batchRepo.findOne({
      where: { batch_code: input.batch_code.trim() },
    });
    if (dup)
      throw new ConflictException(
        `batch_code "${input.batch_code}" đã tồn tại`,
      );

    // kiếm tra ngày tháng  (để tránh tạo batch đã quá hạn)
    const planting = parseDate(input.planting_date);
    const expected = parseDate(input.expected_harvest_date);
    if (planting && expected && expected <= planting) {
      throw new BadRequestException(
        'expected_harvest_date phải lớn hơn planting_date',
      );
    }
    
    const batch = this.batchRepo.create({
      batch_code: input.batch_code.trim(),
      farm_id: input.farm_id,
      crop_category_id: input.crop_category_id,
      name: input.name.trim(),
      status: BatchStatus.SEEDING,
      planting_date: planting as any,
      expected_harvest_date: expected as any,
      unit: input.unit?.trim() || 'kg',
      notes: input.notes,
      created_by: caller.userId,
    });
    return this.batchRepo.save(batch);
  }
  // Method update (chỉ update được một số trường, không được phép update farm_id, crop_category_id, batch_code)
  async update(id: string, input: UpdateBatchInput) {
    const batch = await this.findById(id);

    if (input.name !== undefined) {
      if (!input.name.trim())
        throw new BadRequestException('Tên batch không được để trống');
      batch.name = input.name.trim();
    }

    // kiểm tra ngày tháng nếu có thay đổi
    if (input.planting_date !== undefined)
      batch.planting_date = parseDate(input.planting_date) as any;
    if (input.expected_harvest_date !== undefined)
      batch.expected_harvest_date = parseDate(input.expected_harvest_date) as any;
    if (input.actual_harvest_date !== undefined)
      batch.actual_harvest_date = parseDate(input.actual_harvest_date) as any;

    // Kiểm tra tính hợp lệ của ngày tháng nếu có thay đổi
    if (
      batch.planting_date &&
      batch.expected_harvest_date &&
      new Date(batch.expected_harvest_date) <= new Date(batch.planting_date)
    ) {
      throw new BadRequestException(
        'expected_harvest_date phải lớn hơn planting_date',
      );
    }
    if (
      batch.planting_date &&
      batch.actual_harvest_date &&
      new Date(batch.actual_harvest_date) <= new Date(batch.planting_date)
    ) {
      throw new BadRequestException(
        'actual_harvest_date phải lớn hơn planting_date',
      );
    }

    // kiểm tra harvested_quantity, shipped_quantity nếu có thay đổi
    if (input.harvested_quantity !== undefined)
      batch.harvested_quantity = parseNumber(input.harvested_quantity) as any;
    if (input.shipped_quantity !== undefined)
      batch.shipped_quantity = parseNumber(input.shipped_quantity) as any;

    if (
      batch.harvested_quantity != null &&
      batch.shipped_quantity != null &&
      Number(batch.shipped_quantity) > Number(batch.harvested_quantity)
    ) {
      throw new BadRequestException(
        'shipped_quantity không được lớn hơn harvested_quantity',
      );
    }
    
    if (input.unit !== undefined) batch.unit = input.unit.trim() || 'kg';
    if (input.notes !== undefined) batch.notes = input.notes;

    return this.batchRepo.save(batch);
  }
  // Method để chuyển đổi trạng thái của batch
  async transitionStatus(id: string, input: TransitionInput) {
    const batch = await this.findById(id);

    const next = input.next_status as BatchStatus;
    if (!Object.values(BatchStatus).includes(next)) {
      throw new BadRequestException(`next_status không hợp lệ: ${input.next_status}`);
    }

    if (!isValidTransition(batch.status, next)) {
      const allowed = allowedNextStatuses(batch.status);
      throw new BadRequestException(
        `Không thể chuyển ${batch.status} → ${next}. Cho phép: [${allowed.join(', ') || '(none)'}]`,
      );
    }

    // Pre-conditions theo từng transition
    if (next === BatchStatus.HARVESTED) {
      if (!input.actual_harvest_date)
        throw new BadRequestException(
          'actual_harvest_date là bắt buộc khi chuyển sang HARVESTED',
        );
      if (input.harvested_quantity === undefined || input.harvested_quantity === '')
        throw new BadRequestException(
          'harvested_quantity là bắt buộc khi chuyển sang HARVESTED',
        );

      const ah = parseDate(input.actual_harvest_date)!;
      if (batch.planting_date && ah <= new Date(batch.planting_date)) {
        throw new BadRequestException(
          'actual_harvest_date phải lớn hơn planting_date',
        );
      }
      const hq = parseNumber(input.harvested_quantity)!;
      batch.actual_harvest_date = ah as any;
      batch.harvested_quantity = hq as any;
    }

    if (next === BatchStatus.SHIPPED) {
      if (input.shipped_quantity === undefined || input.shipped_quantity === '')
        throw new BadRequestException(
          'shipped_quantity là bắt buộc khi chuyển sang SHIPPED',
        );
      const sq = parseNumber(input.shipped_quantity)!;
      if (
        batch.harvested_quantity != null &&
        sq > Number(batch.harvested_quantity)
      ) {
        throw new BadRequestException(
          'shipped_quantity không được lớn hơn harvested_quantity',
        );
      }
      batch.shipped_quantity = sq as any;
    }

    batch.status = next;
    return this.batchRepo.save(batch);
  }
  // Method delete (chỉ xóa được batch ở trạng thái SEEDING)
  async delete(id: string) {
    const batch = await this.findById(id);
    await this.batchRepo.remove(batch);
  }
  // Method findById (dùng chung cho update, delete, transition)
  async findById(id: string) {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: ['farm', 'crop_category'],
    });
    if (!batch) throw new NotFoundException(`Batch ${id} không tìm thấy`);
    return batch;
  }
  async findByCode(batchCode: string) {
    const batch = await this.batchRepo.findOne({
      where: { batch_code: batchCode },
      relations: ['farm', 'crop_category'],
    });
    if (!batch) throw new NotFoundException(`Batch với mã "${batchCode}" không tìm thấy`);
    return batch;
  }

  // ABAC kiểm tra ownership batch thông qua farm chứa batch đó
  async checkOwnership(userId: string, batchId: string): Promise<boolean> {
    const row = await this.batchRepo
      .createQueryBuilder('b')
      .innerJoin('b.farm', 'f')
      .where('b.id = :batchId', { batchId })
      .andWhere('f.owner_id = :userId', { userId })
      .getCount();
    return row > 0;
  }

  // Method list với filter theo farm_id, status và pagination
  async list({ farm_id, status, page = 1, limit = 20 }: ListParams) {
    const qb = this.batchRepo.createQueryBuilder('b');
    if (farm_id) qb.andWhere('b.farm_id = :farm_id', { farm_id });
    if (status) qb.andWhere('b.status = :status', { status });
    qb.orderBy('b.created_at', 'DESC');

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    qb.skip((safePage - 1) * safeLimit).take(safeLimit);

    const [items, total] = await qb.getManyAndCount();
    return { items, page: safePage, limit: safeLimit, total };
  }
}
