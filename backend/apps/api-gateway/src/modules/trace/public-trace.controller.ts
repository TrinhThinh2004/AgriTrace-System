import {
  Controller,
  Get,
  Param,
  Inject,
  Logger,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Observable, firstValueFrom } from 'rxjs';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '@app/shared';
import { Public } from '../../common/decorators';

interface ProductServiceGrpc {
  getBatchByCode(data: { batch_code: string }): Observable<any>;
  getFarmById(data: { farm_id: string }): Observable<any>;
  getCropCategoryById(data: { id: string }): Observable<any>;
}

interface TraceServiceGrpc {
  getActivityLogsByBatch(data: { batch_id: string }): Observable<any>;
  getInspectionsByBatch(data: { batch_id: string }): Observable<any>;
}

@Controller('public/trace')
export class PublicTraceController implements OnModuleInit {
  private readonly logger = new Logger(PublicTraceController.name);
  private product!: ProductServiceGrpc;
  private trace!: TraceServiceGrpc;
  private readonly cacheTtl: number;

  // Inject cả 2 client gRPC và Redis client qua Dependency Injection
  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientGrpc,
    @Inject('TRACE_SERVICE') private readonly traceClient: ClientGrpc,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.cacheTtl = parseInt(
      config.get<string>('QR_CACHE_TTL_SEC') ?? '60',
      10,
    );
  }

  onModuleInit() {
    this.product =
      this.productClient.getService<ProductServiceGrpc>('ProductService');
    this.trace =
      this.traceClient.getService<TraceServiceGrpc>('TraceService');
  }

  private cacheKey(batchCode: string): string {
    return `qr:trace:${batchCode}`;
  }

  @Public()
  @Get(':batchCode')
  async getTrace(@Param('batchCode') batchCode: string) {
    // 0. Cache hit?
    const key = this.cacheKey(batchCode);
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      this.logger.warn(`Redis GET lỗi (bypass cache): ${(err as Error).message}`);
    }

    // 1. Lấy batch theo batch_code
    let batch: any;
    try {
      batch = await firstValueFrom(
        this.product.getBatchByCode({ batch_code: batchCode }),
      );
    } catch {
      // Không cache miss để tránh poison cache khi batch chưa tồn tại
      throw new NotFoundException(
        `Không tìm thấy lô hàng với mã "${batchCode}"`,
      );
    }

    // 2. Lấy farm + crop category + activity logs + inspections song song
    const [farm, crop, activityLogsRes, inspectionsRes] = await Promise.all([
      firstValueFrom(
        this.product.getFarmById({ farm_id: batch.farm_id }),
      ).catch(() => null),
      firstValueFrom(
        this.product.getCropCategoryById({ id: batch.crop_category_id }),
      ).catch(() => null),
      firstValueFrom(
        this.trace.getActivityLogsByBatch({ batch_id: batch.id }),
      ).catch(() => ({ logs: [] })),
      firstValueFrom(
        this.trace.getInspectionsByBatch({ batch_id: batch.id }),
      ).catch(() => ({ inspections: [] })),
    ]);

    const payload = {
      batch: {
        id: batch.id,
        batch_code: batch.batch_code,
        name: batch.name,
        status: batch.status,
        planting_date: batch.planting_date,
        expected_harvest_date: batch.expected_harvest_date,
        actual_harvest_date: batch.actual_harvest_date,
        harvested_quantity: batch.harvested_quantity,
        shipped_quantity: batch.shipped_quantity,
        unit: batch.unit,
        notes: batch.notes,
        created_at: batch.created_at,
      },
      farm: farm
        ? {
            name: farm.name,
            address: farm.address,
            area_hectares: farm.area_hectares,
            certification_status: farm.certification_status,
          }
        : null,
      crop: crop
        ? {
            name: crop.name,
            description: crop.description,
          }
        : null,
      activity_logs: (activityLogsRes.logs ?? []).map((log: any) => ({
        id: log.id,
        activity_type: log.activity_type,
        performed_by: log.performed_by,
        performed_at: log.performed_at,
        location: log.location,
        notes: log.notes,
        inputs_used: log.inputs_used ?? [],
        is_signed: log.is_signed ?? false,
        signed_at: log.signed_at,
      })),
      inspections: (inspectionsRes.inspections ?? []).map((ins: any) => ({
        id: ins.id,
        inspector_id: ins.inspector_id,
        inspection_type: ins.inspection_type,
        result: ins.result,
        scheduled_at: ins.scheduled_at,
        conducted_at: ins.conducted_at,
        notes: ins.notes,
        report_url: ins.report_url,
        is_signed: ins.is_signed ?? false,
        signed_at: ins.signed_at,
      })),
    };

    // Cache lại (best-effort, không fail request nếu Redis lỗi)
    try {
      await this.redis.set(key, JSON.stringify(payload), 'EX', this.cacheTtl);
    } catch (err) {
      this.logger.warn(`Redis SET lỗi: ${(err as Error).message}`);
    }

    return payload;
  }
}
