import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspection } from '../entities/inspection.entity';
import { InspectionType, InspectionResult } from '@app/shared';
import {
  CreateInspectionDto,
  UpdateInspectionDto,
  ListInspectionDto,
  SignInspectionDto,
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

function assertInspectionType(v: string): InspectionType {
  if (!Object.values(InspectionType).includes(v as InspectionType)) {
    throw new BadRequestException(`inspection_type không hợp lệ: ${v}`);
  }
  return v as InspectionType;
}

function assertInspectionResult(v: string): InspectionResult {
  if (!Object.values(InspectionResult).includes(v as InspectionResult)) {
    throw new BadRequestException(`result không hợp lệ: ${v}`);
  }
  return v as InspectionResult;
}

function validateScheduledVsConducted(
  scheduled?: Date | null,
  conducted?: Date | null,
) {
  if (scheduled && conducted && conducted.getTime() < scheduled.getTime()) {
    throw new BadRequestException(
      'conducted_at phải >= scheduled_at',
    );
  }
}

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private readonly repo: Repository<Inspection>,
  ) {}
  // method create 
  async create(input: CreateInspectionDto, caller: CallerCtx) {
    if (!caller?.userId) throw new ForbiddenException('Thiếu thông tin caller');

    if (!input.batch_id) throw new BadRequestException('batch_id là bắt buộc');
    if (!input.inspector_id)
      throw new BadRequestException('inspector_id là bắt buộc');
    if (!input.inspection_type)
      throw new BadRequestException('inspection_type là bắt buộc');

    const scheduled = parseDate(input.scheduled_at);
    const conducted = parseDate(input.conducted_at);
    validateScheduledVsConducted(scheduled, conducted);

    const result = input.result
      ? assertInspectionResult(String(input.result))
      : InspectionResult.PENDING;

    // Nếu result khác PENDING thì phải có conducted_at
    if (result !== InspectionResult.PENDING && !conducted) {
      throw new BadRequestException(
        'conducted_at là bắt buộc khi result khác PENDING',
      );
    }

    const inspection = this.repo.create({
      batch_id: input.batch_id,
      inspector_id: input.inspector_id,
      inspection_type: assertInspectionType(String(input.inspection_type)),
      result,
      scheduled_at: scheduled as any,
      conducted_at: conducted as any,
      notes: input.notes ?? undefined,
      report_url: input.report_url ?? undefined,
    });
    return this.repo.save(inspection);
  }
  // method update
  async update(id: string, input: UpdateInspectionDto) {
    const inspection = await this.findById(id);
    if (inspection.signed_at) {
      throw new ConflictException(
        'Inspection đã được ký — không thể chỉnh sửa',
      );
    }

    if (input.inspection_type !== undefined) {
      inspection.inspection_type = assertInspectionType(
        String(input.inspection_type),
      );
    }
    if (input.result !== undefined) {
      inspection.result = assertInspectionResult(String(input.result));
    }
    if (input.scheduled_at !== undefined) {
      inspection.scheduled_at = parseDate(input.scheduled_at) as any;
    }
    if (input.conducted_at !== undefined) {
      inspection.conducted_at = parseDate(input.conducted_at) as any;
    }
    validateScheduledVsConducted(
      inspection.scheduled_at ? new Date(inspection.scheduled_at) : null,
      inspection.conducted_at ? new Date(inspection.conducted_at) : null,
    );

    // Sau khi merge: nếu result != PENDING phải có conducted_at
    if (
      inspection.result !== InspectionResult.PENDING &&
      !inspection.conducted_at
    ) {
      throw new BadRequestException(
        'conducted_at là bắt buộc khi result khác PENDING',
      );
    }

    if (input.notes !== undefined) inspection.notes = input.notes;
    if (input.report_url !== undefined) inspection.report_url = input.report_url;

    return this.repo.save(inspection);
  }
  // method delete
  async delete(id: string) {
    const inspection = await this.findById(id);
    if (inspection.signed_at) {
      throw new ConflictException('Inspection đã được ký — không thể xoá');
    }
    await this.repo.softRemove(inspection);
  }
  // method findById
  async findById(id: string) {
    const inspection = await this.repo.findOne({ where: { id } });
    if (!inspection)
      throw new NotFoundException(`Inspection ${id} không tìm thấy`);
    return inspection;
  }
  // method findByBatch
  async findByBatch(batchId: string) {
    return this.repo.find({
      where: { batch_id: batchId },
      order: { created_at: 'DESC' },
    });
  }

  async list({
    batch_id,
    inspector_id,
    inspection_type,
    result,
    page = 1,
    limit = 20,
  }: ListInspectionDto) {
    const qb = this.repo.createQueryBuilder('i');
    if (batch_id) qb.andWhere('i.batch_id = :batch_id', { batch_id });
    if (inspector_id)
      qb.andWhere('i.inspector_id = :inspector_id', { inspector_id });
    if (inspection_type)
      qb.andWhere('i.inspection_type = :inspection_type', { inspection_type });
    if (result) qb.andWhere('i.result = :result', { result });
    qb.orderBy('i.created_at', 'DESC');

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    qb.skip((safePage - 1) * safeLimit).take(safeLimit);

    const [items, total] = await qb.getManyAndCount();
    return { items, page: safePage, limit: safeLimit, total };
  }

  async sign(id: string, dto: SignInspectionDto) {
    if (!dto?.digital_signature)
      throw new BadRequestException('digital_signature là bắt buộc');
    if (!dto?.signed_at)
      throw new BadRequestException('signed_at là bắt buộc');

    const inspection = await this.findById(id);
    if (inspection.digital_signature) {
      throw new ConflictException('Inspection đã được ký trước đó');
    }
    inspection.digital_signature = dto.digital_signature;
    inspection.signed_at = parseDate(dto.signed_at)! as any;
    return this.repo.save(inspection);
  }
}
