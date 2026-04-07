import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../entities/batch.entity';
import { Farm } from '../entities/farm.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,

    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
  ) {}

  async getBatchById(batchId: string) {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException(`Batch ${batchId} không tìm thấy`);
    return batch;
  }

  async getFarmById(farmId: string) {
    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) throw new NotFoundException(`Farm ${farmId} không tìm thấy`);
    return farm;
  }

  // ABAC kiểm tra ownership 

  async checkFarmOwnership(userId: string, farmId: string): Promise<boolean> {
    const count = await this.farmRepo.count({
      where: { id: farmId, owner_id: userId },
    });
    return count > 0;
  }

  async checkBatchOwnership(userId: string, batchId: string): Promise<boolean> {
    // Batch thuộc về user nếu farm chứa batch đó có owner_id = user
    const row = await this.batchRepo
      .createQueryBuilder('b')
      .innerJoin('b.farm', 'f')
      .where('b.id = :batchId', { batchId })
      .andWhere('f.owner_id = :userId', { userId })
      .getCount();
    return row > 0;
  }
}
