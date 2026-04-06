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
}
