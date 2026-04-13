import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityType } from '@app/shared';
import {
  CreateActivityLogDto,
  UpdateActivityLogDto,
  ListActivityLogDto,
  SignActivityLogDto,
  InputUsed,
} from './dto';

interface CallerCtx {
  userId: string | null;
  role: string | null;
}

function parseDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime()))
    throw new BadRequestException(`Ngày không hợp lệ: ${v}`);
  return d;
}

function assertActivityType(v: string): ActivityType {
  if (!Object.values(ActivityType).includes(v as ActivityType)) {
    throw new BadRequestException(`activity_type không hợp lệ: ${v}`);
  }
  return v as ActivityType;
}

function normalizeInputs(items?: InputUsed[]): InputUsed[] | undefined {
  if (!items) return undefined;
  return items.map((i) => ({
    name: (i?.name ?? '').toString(),
    quantity: (i?.quantity ?? '').toString(),
    unit: (i?.unit ?? '').toString(),
  }));
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) {}

  async create(input: CreateActivityLogDto, caller: CallerCtx) {
    if (!caller?.userId) throw new ForbiddenException('Thiếu thông tin caller');

    if (!input.batch_id) throw new BadRequestException('batch_id là bắt buộc');
    if (!input.activity_type)
      throw new BadRequestException('activity_type là bắt buộc');
    if (!input.performed_by)
      throw new BadRequestException('performed_by là bắt buộc');
    if (!input.performed_at)
      throw new BadRequestException('performed_at là bắt buộc');

    const performedAt = parseDate(input.performed_at)!;
    if (performedAt.getTime() > Date.now()) {
      throw new BadRequestException('performed_at không được ở tương lai');
    }

    const log = this.repo.create({
      batch_id: input.batch_id,
      activity_type: assertActivityType(String(input.activity_type)),
      performed_by: input.performed_by,
      performed_at: performedAt as any,
      location: input.location ?? undefined,
      notes: input.notes ?? undefined,
      inputs_used: normalizeInputs(input.inputs_used) ?? [],
    });
    return this.repo.save(log);
  }
  // method update sẽ cho phép chỉnh sửa các trường của ActivityLog nếu nó chưa được ký
  async update(id: string, input: UpdateActivityLogDto) {
    const log = await this.findById(id);
    if (log.signed_at) {
      throw new ConflictException(
        'ActivityLog đã được ký — không thể chỉnh sửa',
      );
    }

    if (input.activity_type !== undefined) {
      log.activity_type = assertActivityType(String(input.activity_type));
    }
    if (input.performed_at !== undefined) {
      const d = parseDate(input.performed_at)!;
      if (d.getTime() > Date.now()) {
        throw new BadRequestException('performed_at không được ở tương lai');
      }
      log.performed_at = d as any;
    }
    if (input.location !== undefined) log.location = input.location;
    if (input.notes !== undefined) log.notes = input.notes;
    if (input.inputs_used !== undefined) {
      log.inputs_used = normalizeInputs(input.inputs_used) ?? [];
    }

    return this.repo.save(log);
  }
  // method delete 
  async delete(id: string) {
    const log = await this.findById(id);
    if (log.signed_at) {
      throw new ConflictException(
        'ActivityLog đã được ký — không thể xoá',
      );
    }
    await this.repo.remove(log);
  }
  // method findById
  async findById(id: string) {
    const log = await this.repo.findOne({ where: { id } });
    if (!log) throw new NotFoundException(`ActivityLog ${id} không tìm thấy`);
    return log;
  }
  // method findByBatch sẽ trả về tất cả activity log của một batch, sắp xếp theo performed_at giảm dần
  async findByBatch(batchId: string) {
    return this.repo.find({
      where: { batch_id: batchId },
      order: { performed_at: 'DESC' },
    });
  }
  // method list
  async list({
    batch_id,
    activity_type,
    performed_by,
    page = 1,
    limit = 20,
  }: ListActivityLogDto) {
    const qb = this.repo.createQueryBuilder('l');
    if (batch_id) qb.andWhere('l.batch_id = :batch_id', { batch_id });
    if (activity_type)
      qb.andWhere('l.activity_type = :activity_type', { activity_type });
    if (performed_by)
      qb.andWhere('l.performed_by = :performed_by', { performed_by });
    qb.orderBy('l.performed_at', 'DESC');

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    qb.skip((safePage - 1) * safeLimit).take(safeLimit);

    const [items, total] = await qb.getManyAndCount();
    return { items, page: safePage, limit: safeLimit, total };
  }
  // method sign sẽ cho phép ký vào activity log
  //  một khi đã ký thì không thể chỉnh sửa hoặc xoá log đó nữa
  async sign(id: string, dto: SignActivityLogDto) {
    if (!dto?.digital_signature)
      throw new BadRequestException('digital_signature là bắt buộc');
    if (!dto?.signed_at)
      throw new BadRequestException('signed_at là bắt buộc');

    const log = await this.findById(id);
    if (log.digital_signature) {
      throw new ConflictException('ActivityLog đã được ký trước đó');
    }
    log.digital_signature = dto.digital_signature;
    log.signed_at = parseDate(dto.signed_at)! as any;
    return this.repo.save(log);
  }
}
