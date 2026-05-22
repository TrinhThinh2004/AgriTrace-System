import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { withAuthMetadata } from '../../common/grpc/with-auth-metadata';
import { GeminiClient } from './gemini.client';
import {
  buildActivityLogPrompt,
  buildBatchPlantingPrompt,
  buildInspectionSummaryPrompt,
} from './prompts';

interface ProductServiceGrpc {
  getBatchById(data: any, metadata?: any): Observable<any>;
  getFarmById(data: any, metadata?: any): Observable<any>;
  getCropCategoryById(data: any, metadata?: any): Observable<any>;
}

interface TraceServiceGrpc {
  getActivityLogsByBatch(data: any, metadata?: any): Observable<any>;
}

type AuthUser = { id: string; role: string };

export interface SuggestBatchPlantingDto {
  farm_id?: string;
  crop_category_id?: string;
  season_hint?: string;
}

export interface SuggestActivityLogDto {
  batch_id: string;
  activity_type: string;
}

export interface SuggestInspectionDto {
  batch_id: string;
}

const RECENT_ACTIVITY_LIMIT = 5;

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private productSvc!: ProductServiceGrpc;
  private traceSvc!: TraceServiceGrpc;

  constructor(
    private readonly gemini: GeminiClient,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientGrpc,
    @Inject('TRACE_SERVICE') private readonly traceClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productSvc =
      this.productClient.getService<ProductServiceGrpc>('ProductService');
    this.traceSvc =
      this.traceClient.getService<TraceServiceGrpc>('TraceService');
  }

  async suggestBatchPlanting(user: AuthUser, dto: SuggestBatchPlantingDto) {
    let farm_name = '';
    let farm_address = '';
    let crop_category = '';

    if (dto.farm_id) {
      const farm = await firstValueFrom(
        this.productSvc.getFarmById(
          { id: dto.farm_id },
          withAuthMetadata(user),
        ),
      );
      farm_name = farm?.name ?? '';
      farm_address = farm?.address ?? '';
    }

    if (dto.crop_category_id) {
      const cc = await firstValueFrom(
        this.productSvc.getCropCategoryById(
          { id: dto.crop_category_id },
          withAuthMetadata(user),
        ),
      );
      crop_category = cc?.name ?? '';
    }

    return this.runGemini(
      buildBatchPlantingPrompt({
        farm_name,
        farm_address,
        crop_category,
        season_hint: dto.season_hint ?? '',
        user_role: user.role,
      }),
      'batch-planting',
    );
  }

  async suggestActivityLog(user: AuthUser, dto: SuggestActivityLogDto) {
    if (!dto.batch_id) throw new BadRequestException('Thiếu batch_id');
    if (!dto.activity_type)
      throw new BadRequestException('Thiếu activity_type');

    const batch = await firstValueFrom(
      this.productSvc.getBatchById(
        { id: dto.batch_id },
        withAuthMetadata(user),
      ),
    );
    if (!batch) throw new BadRequestException('Không tìm thấy lô hàng');

    let crop_category = '';
    if (batch.crop_category_id) {
      const cc = await firstValueFrom(
        this.productSvc.getCropCategoryById(
          { id: batch.crop_category_id },
          withAuthMetadata(user),
        ),
      );
      crop_category = cc?.name ?? '';
    }

    const logsRes = await firstValueFrom(
      this.traceSvc.getActivityLogsByBatch(
        { batch_id: dto.batch_id },
        withAuthMetadata(user),
      ),
    );
    const recent = (logsRes?.logs ?? [])
      .slice(0, RECENT_ACTIVITY_LIMIT)
      .map((log: any) => ({
        activity_type: log.activity_type ?? '',
        performed_at: log.performed_at ?? '',
        inputs_summary: summarizeInputs(log.inputs_used),
      }));

    return this.runGemini(
      buildActivityLogPrompt({
        batch_code: batch.batch_code ?? '',
        crop_category,
        activity_type: dto.activity_type,
        planting_date: batch.planting_date ?? '',
        current_status: batch.status ?? '',
        recent_activities: recent,
      }),
      'activity-log',
    );
  }

  async suggestInspectionSummary(user: AuthUser, dto: SuggestInspectionDto) {
    if (!dto.batch_id) throw new BadRequestException('Thiếu batch_id');

    const batch = await firstValueFrom(
      this.productSvc.getBatchById(
        { id: dto.batch_id },
        withAuthMetadata(user),
      ),
    );
    if (!batch) throw new BadRequestException('Không tìm thấy lô hàng');

    const [crop, farm, logsRes] = await Promise.all([
      batch.crop_category_id
        ? firstValueFrom(
            this.productSvc.getCropCategoryById(
              { id: batch.crop_category_id },
              withAuthMetadata(user),
            ),
          )
        : Promise.resolve(null),
      batch.farm_id
        ? firstValueFrom(
            this.productSvc.getFarmById(
              { id: batch.farm_id },
              withAuthMetadata(user),
            ),
          )
        : Promise.resolve(null),
      firstValueFrom(
        this.traceSvc.getActivityLogsByBatch(
          { batch_id: dto.batch_id },
          withAuthMetadata(user),
        ),
      ),
    ]);

    const all = (logsRes?.logs ?? []).map((log: any) => ({
      activity_type: log.activity_type ?? '',
      performed_at: log.performed_at ?? '',
      inputs_summary: summarizeInputs(log.inputs_used),
    }));

    return this.runGemini(
      buildInspectionSummaryPrompt({
        batch_code: batch.batch_code ?? '',
        crop_category: crop?.name ?? '',
        farm_name: farm?.name ?? '',
        planting_date: batch.planting_date ?? '',
        harvest_date:
          batch.actual_harvest_date || batch.expected_harvest_date || '',
        current_status: batch.status ?? '',
        all_activities: all,
      }),
      'inspection-summary',
    );
  }

  private async runGemini(prompt: string, label: string) {
    try {
      const r = await this.gemini.generate(prompt);
      this.logger.debug(
        `[ai/${label}] ${r.tokensUsed} tokens, ${r.latencyMs}ms`,
      );
      return {
        content: r.content,
        model: r.model,
        tokens_used: r.tokensUsed,
        latency_ms: r.latencyMs,
      };
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      this.logger.error(`[ai/${label}] Gemini call failed: ${msg}`);
      throw new InternalServerErrorException(`AI: ${msg}`);
    }
  }
}

function summarizeInputs(inputs: any[] | undefined): string {
  if (!inputs || inputs.length === 0) return '';
  return inputs
    .map((i) => {
      const qty = i.quantity ? ` ${i.quantity}${i.unit ?? ''}` : '';
      return `${i.name ?? ''}${qty}`.trim();
    })
    .filter(Boolean)
    .join(', ');
}
