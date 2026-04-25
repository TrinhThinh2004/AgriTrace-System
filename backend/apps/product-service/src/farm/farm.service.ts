import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from '../entities/farm.entity';
import { Batch } from '../entities/batch.entity';
import { CertificationStatus, FarmStatus, Role } from '@app/shared';

interface CreateFarmInput {
  owner_id?: string;
  name: string;
  address?: string;
  location_lat?: string | number;
  location_long?: string | number;
  area_hectares?: string | number;
  certification_status?: string;
}

interface UpdateFarmInput {
  name?: string;
  address?: string;
  location_lat?: string | number;
  location_long?: string | number;
  area_hectares?: string | number;
  certification_status?: string;
  status?: string;
}

interface ListParams {
  owner_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface CallerCtx {
  userId: string | null;
  role: string | null;
}

function toNumberOrNull(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
// Service chứa business logic
@Injectable()
export class FarmService {
  constructor(
    @InjectRepository(Farm)
    private readonly repo: Repository<Farm>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
  ) {}

  async create(input: CreateFarmInput, caller: CallerCtx) {
    if (!caller?.userId) throw new ForbiddenException('Thiếu thông tin caller');
    if (!input.name?.trim()) throw new BadRequestException('Tên farm không được để trống');

    // Farmer chỉ được tạo farm cho chính mình; Admin có thể truyền owner_id tự do
    const ownerId =
      caller.role === Role.ADMIN && input.owner_id
        ? input.owner_id
        : caller.userId;

    const certStatus =
      (input.certification_status as CertificationStatus) ||
      CertificationStatus.NONE;
    if (!Object.values(CertificationStatus).includes(certStatus)) {
      throw new BadRequestException(
        `certification_status không hợp lệ: ${input.certification_status}`,
      );
    }

    const farm = this.repo.create({
      owner_id: ownerId,
      name: input.name.trim(),
      address: input.address ?? undefined,
      location_lat: toNumberOrNull(input.location_lat) as any,
      location_long: toNumberOrNull(input.location_long) as any,
      area_hectares: toNumberOrNull(input.area_hectares) as any,
      certification_status: certStatus,
      status: FarmStatus.ACTIVE,
    });
    return this.repo.save(farm);
  }
  // Method update với validate input và kiểm tra farm tồn tại
  async update(id: string, input: UpdateFarmInput) {
    const farm = await this.findById(id);

    if (input.name !== undefined) {
      if (!input.name.trim())
        throw new BadRequestException('Tên farm không được để trống');
      farm.name = input.name.trim();
    }
    if (input.address !== undefined) farm.address = input.address;
    if (input.location_lat !== undefined)
      farm.location_lat = toNumberOrNull(input.location_lat) as any;
    if (input.location_long !== undefined)
      farm.location_long = toNumberOrNull(input.location_long) as any;
    if (input.area_hectares !== undefined)
      farm.area_hectares = toNumberOrNull(input.area_hectares) as any;

    if (input.certification_status) {
      if (
        !Object.values(CertificationStatus).includes(
          input.certification_status as CertificationStatus,
        )
      ) {
        throw new BadRequestException(
          `certification_status không hợp lệ: ${input.certification_status}`,
        );
      }
      farm.certification_status =
        input.certification_status as CertificationStatus;
    }

    if (input.status) {
      if (!Object.values(FarmStatus).includes(input.status as FarmStatus)) {
        throw new BadRequestException(`status không hợp lệ: ${input.status}`);
      }
      farm.status = input.status as FarmStatus;
    }

    return this.repo.save(farm);
  }
  // Method delete — chặn nếu còn batch (chưa soft-delete) đang tham chiếu
  async delete(id: string) {
    const farm = await this.findById(id);

    const inUse = await this.batchRepo.count({ where: { farm_id: id } });
    if (inUse > 0) {
      throw new ConflictException(
        `Không thể xóa "${farm.name}": đang có ${inUse} lô hàng thuộc trang trại này. ` +
          `Hãy xóa hoặc chuyển các lô hàng trước khi xóa trang trại.`,
      );
    }

    await this.repo.softRemove(farm);
  }
  // Method findById
  async findById(id: string) {
    const farm = await this.repo.findOne({ where: { id } });
    if (!farm) throw new NotFoundException(`Farm ${id} không tìm thấy`);
    return farm;
  }
  async checkOwnership(userId: string, farmId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { id: farmId, owner_id: userId },
    });
    return count > 0;
  }

  // Method list với filter theo owner_id, status và pagination
  async list({ owner_id, status, page = 1, limit = 20 }: ListParams) {
    const qb = this.repo.createQueryBuilder('f');
    if (owner_id) qb.andWhere('f.owner_id = :owner_id', { owner_id });
    if (status) qb.andWhere('f.status = :status', { status });
    qb.orderBy('f.created_at', 'DESC');

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    qb.skip((safePage - 1) * safeLimit).take(safeLimit);

    const [items, total] = await qb.getManyAndCount();
    return { items, page: safePage, limit: safeLimit, total };
  }
}
