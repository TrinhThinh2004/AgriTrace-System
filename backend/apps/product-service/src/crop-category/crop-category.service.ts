import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CropCategory } from '../entities/crop-category.entity';
import { CropCategoryStatus } from '@app/shared';

interface ListParams {
  status?: string;
  page?: number;
  limit?: number;
}
// Service chứa business logic
@Injectable()
export class CropCategoryService {
  constructor(
    @InjectRepository(CropCategory)
    private readonly repo: Repository<CropCategory>,
  ) {}
  // Method create 
  async create(data: { name: string; description?: string }) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('Tên danh mục không được để trống');

    const existing = await this.repo.findOne({ where: { name } });
    if (existing) throw new ConflictException(`Danh mục "${name}" đã tồn tại`);

    const cc = this.repo.create({
      name,
      description: data.description ?? undefined,
      status: CropCategoryStatus.ACTIVE,
    });
    return this.repo.save(cc);
  }
  // Method update
  async update(
    id: string,
    data: { name?: string; description?: string; status?: string },
  ) {
    const cc = await this.findById(id);

    if (data.name && data.name.trim() !== cc.name) {
      const dup = await this.repo.findOne({
        where: { name: data.name.trim(), id: Not(id) },
      });
      if (dup) throw new ConflictException(`Danh mục "${data.name}" đã tồn tại`);
      cc.name = data.name.trim();
    }

    if (data.description !== undefined) cc.description = data.description;

    if (data.status) {
      if (!Object.values(CropCategoryStatus).includes(data.status as CropCategoryStatus)) {
        throw new BadRequestException(`Status không hợp lệ: ${data.status}`);
      }
      cc.status = data.status as CropCategoryStatus;
    }

    return this.repo.save(cc);
  }
  // Method delete 
  async delete(id: string) {
    const cc = await this.findById(id);
    await this.repo.softRemove(cc);
  }
  // Method findById
  async findById(id: string) {
    const cc = await this.repo.findOne({ where: { id } });
    if (!cc) throw new NotFoundException(`Crop category ${id} không tìm thấy`);
    return cc;
  }
  // Method list với filter theo status và pagination
  async list({ status, page = 1, limit = 20 }: ListParams) {
    const qb = this.repo.createQueryBuilder('cc');
    if (status) qb.andWhere('cc.status = :status', { status });
    qb.orderBy('cc.created_at', 'DESC');
    // Pagination
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    qb.skip((safePage - 1) * safeLimit).take(safeLimit);

    const [items, total] = await qb.getManyAndCount();
    return { items, page: safePage, limit: safeLimit, total };
  }
}
