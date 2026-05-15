import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  CertificationStatus,
  ChecklistResponseStatus,
  Role,
  NotificationType,
  RABBIT_EXCHANGE,
  NOTIFICATION_DISPATCH_ROUTING_KEY,
  NotificationDispatchMessage,
} from '@app/shared';
import { CertificationTemplate } from '../entities/certification-template.entity';
import { ChecklistItem } from '../entities/checklist-item.entity';
import { ChecklistResponse } from '../entities/checklist-response.entity';
import { ChecklistResponseItem } from '../entities/checklist-response-item.entity';
import { Farm } from '../entities/farm.entity';
import { FarmService } from '../farm/farm.service';

interface CallerCtx {
  userId: string | null;
  role: string | null;
}

interface CreateTemplateItemInput {
  order?: number;
  category: string;
  code: string;
  title: string;
  description?: string;
  required?: boolean;
  evidence_required?: boolean;
}

interface CreateTemplateInput {
  code: string;
  name: string;
  cert_type: string;
  version?: number;
  description?: string;
  active?: boolean;
  items?: CreateTemplateItemInput[];
}

interface UpdateTemplateInput {
  name?: string;
  description?: string;
  active?: boolean;
}

interface ListTemplatesParams {
  cert_type?: string;
  active_only?: boolean;
  page?: number;
  limit?: number;
}

const REQUESTABLE_TYPES: CertificationStatus[] = [
  CertificationStatus.VIETGAP,
  CertificationStatus.GLOBALGAP,
  CertificationStatus.ORGANIC,
];

@Injectable()
export class CertificationService {
  private readonly logger = new Logger(CertificationService.name);

  constructor(
    @InjectRepository(CertificationTemplate)
    private readonly templateRepo: Repository<CertificationTemplate>,
    @InjectRepository(ChecklistItem)
    private readonly itemRepo: Repository<ChecklistItem>,
    @InjectRepository(ChecklistResponse)
    private readonly responseRepo: Repository<ChecklistResponse>,
    @InjectRepository(ChecklistResponseItem)
    private readonly responseItemRepo: Repository<ChecklistResponseItem>,
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    private readonly dataSource: DataSource,
    private readonly farmService: FarmService,
    private readonly amqp: AmqpConnection,
  ) {}

  // ── Template CRUD (Admin) ──

  async createTemplate(input: CreateTemplateInput, caller: CallerCtx) {
    this.requireAdmin(caller);
    if (!input.code?.trim()) throw new BadRequestException('code không được rỗng');
    if (!input.name?.trim()) throw new BadRequestException('name không được rỗng');

    const certType = input.cert_type as CertificationStatus;
    if (!REQUESTABLE_TYPES.includes(certType)) {
      throw new BadRequestException(
        'cert_type phải là VIETGAP, GLOBALGAP hoặc ORGANIC',
      );
    }

    const existing = await this.templateRepo.findOne({
      where: { code: input.code.trim() },
    });
    if (existing) {
      throw new ConflictException(`Template code "${input.code}" đã tồn tại`);
    }

    return this.dataSource.transaction(async (tx) => {
      const tpl = tx.getRepository(CertificationTemplate).create({
        code: input.code.trim(),
        name: input.name.trim(),
        cert_type: certType,
        version: input.version ?? 1,
        active: input.active ?? true,
        description: input.description ?? null,
      });
      const saved = await tx.getRepository(CertificationTemplate).save(tpl);

      if (input.items?.length) {
        const items = input.items.map((it, idx) =>
          tx.getRepository(ChecklistItem).create({
            template_id: saved.id,
            order: it.order ?? idx,
            category: it.category,
            code: it.code,
            title: it.title,
            description: it.description ?? null,
            required: it.required ?? true,
            evidence_required: it.evidence_required ?? false,
          }),
        );
        await tx.getRepository(ChecklistItem).save(items);
      }
      return this.findTemplateByIdInternal(saved.id, tx.getRepository(CertificationTemplate));
    });
  }

  async updateTemplate(id: string, input: UpdateTemplateInput, caller: CallerCtx) {
    this.requireAdmin(caller);
    const tpl = await this.findTemplateByIdInternal(id, this.templateRepo);
    if (input.name !== undefined) tpl.name = input.name.trim();
    if (input.description !== undefined) tpl.description = input.description;
    if (input.active !== undefined) tpl.active = input.active;
    await this.templateRepo.save(tpl);
    return this.findTemplateByIdInternal(id, this.templateRepo);
  }

  async listTemplates(params: ListTemplatesParams) {
    const qb = this.templateRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.items', 'i');
    if (params.cert_type) qb.andWhere('t.cert_type = :ct', { ct: params.cert_type });
    if (params.active_only) qb.andWhere('t.active = true');
    qb.orderBy('t.created_at', 'DESC').addOrderBy('i.order', 'ASC');

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, page, limit, total };
  }

  async getTemplate(id?: string, code?: string) {
    const qb = this.templateRepo.createQueryBuilder('t').leftJoinAndSelect('t.items', 'i');
    if (id) qb.where('t.id = :id', { id });
    else if (code) qb.where('t.code = :code', { code });
    else throw new BadRequestException('Cần id hoặc code');
    qb.orderBy('i.order', 'ASC');
    const tpl = await qb.getOne();
    if (!tpl) throw new NotFoundException('Template không tồn tại');
    return tpl;
  }

  // ── Checklist Response (Farmer) ──

  async startResponse(farmId: string, templateId: string, caller: CallerCtx) {
    if (!caller.userId) throw new ForbiddenException('Thiếu thông tin caller');

    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Farm không tồn tại');
    if (caller.role === Role.FARMER && farm.owner_id !== caller.userId) {
      throw new ForbiddenException('Bạn không sở hữu trang trại này');
    }

    if (
      farm.certification_status !== CertificationStatus.NONE &&
      farm.certification_status !== CertificationStatus.PENDING
    ) {
      throw new ConflictException(
        `Farm đã có chứng nhận ${farm.certification_status}. Huỷ chứng nhận hiện tại trước khi xin loại mới.`,
      );
    }

    const tpl = await this.getTemplate(templateId);
    if (!tpl.active) throw new BadRequestException('Template không còn hoạt động');

    // Đã có response DRAFT hoặc SUBMITTED cho farm này → trả về thay vì tạo mới
    const existing = await this.responseRepo.findOne({
      where: { farm_id: farmId, status: ChecklistResponseStatus.DRAFT },
      order: { created_at: 'DESC' },
    });
    if (existing) {
      return this.findResponseByIdWithRelations(existing.id);
    }

    const submitted = await this.responseRepo.findOne({
      where: { farm_id: farmId, status: ChecklistResponseStatus.SUBMITTED },
    });
    if (submitted) {
      throw new ConflictException(
        'Đã có checklist đang chờ admin duyệt — không thể tạo mới.',
      );
    }

    const created = this.responseRepo.create({
      farm_id: farmId,
      template_id: templateId,
      status: ChecklistResponseStatus.DRAFT,
    });
    const saved = await this.responseRepo.save(created);
    return this.findResponseByIdWithRelations(saved.id);
  }

  async upsertAnswer(
    responseId: string,
    itemId: string,
    answer: string,
    evidenceAssetIds: string[],
    caller: CallerCtx,
  ) {
    if (!caller.userId) throw new ForbiddenException('Thiếu thông tin caller');

    const response = await this.responseRepo.findOne({ where: { id: responseId } });
    if (!response) throw new NotFoundException('Response không tồn tại');
    if (response.status !== ChecklistResponseStatus.DRAFT) {
      throw new ConflictException('Chỉ có thể chỉnh sửa khi response ở trạng thái DRAFT');
    }
    await this.assertOwnsResponseFarm(response.farm_id, caller);

    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item không tồn tại');
    if (item.template_id !== response.template_id) {
      throw new BadRequestException('Item không thuộc template của response này');
    }

    let row = await this.responseItemRepo.findOne({
      where: { response_id: responseId, item_id: itemId },
    });
    if (!row) {
      row = this.responseItemRepo.create({
        response_id: responseId,
        item_id: itemId,
        answer: answer ?? '',
        evidence_asset_ids: Array.isArray(evidenceAssetIds) ? evidenceAssetIds : [],
      });
    } else {
      row.answer = answer ?? '';
      row.evidence_asset_ids = Array.isArray(evidenceAssetIds) ? evidenceAssetIds : [];
    }
    return this.responseItemRepo.save(row);
  }

  async submitResponse(responseId: string, caller: CallerCtx) {
    if (!caller.userId) throw new ForbiddenException('Thiếu thông tin caller');

    const response = await this.findResponseByIdWithRelations(responseId);
    if (response.status !== ChecklistResponseStatus.DRAFT) {
      throw new ConflictException('Chỉ có thể submit response đang ở trạng thái DRAFT');
    }
    await this.assertOwnsResponseFarm(response.farm_id, caller);

    // Validate: required items phải có answer; evidence_required phải có asset
    const template = await this.getTemplate(response.template_id);
    const answersMap = new Map(response.items.map((r) => [r.item_id, r]));
    const missing: string[] = [];
    for (const it of template.items) {
      if (!it.required) continue;
      const ans = answersMap.get(it.id);
      if (!ans || !ans.answer?.trim()) {
        missing.push(`"${it.title}" chưa có câu trả lời`);
        continue;
      }
      if (it.evidence_required && (!ans.evidence_asset_ids?.length)) {
        missing.push(`"${it.title}" cần upload ảnh chứng minh`);
      }
    }
    if (missing.length) {
      throw new BadRequestException(`Chưa hoàn tất: ${missing.join('; ')}`);
    }

    return this.dataSource.transaction(async (tx) => {
      response.status = ChecklistResponseStatus.SUBMITTED;
      response.submitted_at = new Date();
      await tx.getRepository(ChecklistResponse).save(response);

      // Cập nhật Farm status → PENDING với requested type theo template
      const farm = await tx.getRepository(Farm).findOne({ where: { id: response.farm_id } });
      if (!farm) throw new NotFoundException('Farm không tồn tại');
      if (farm.certification_status === CertificationStatus.NONE) {
        farm.certification_status = CertificationStatus.PENDING;
        farm.requested_certification_type = template.cert_type;
        farm.reject_reason = null;
        await tx.getRepository(Farm).save(farm);
      }

      void this.notifyAdminsSubmitted(farm, template);

      return this.findResponseByIdWithRelations(response.id);
    });
  }

  async getLatestByFarm(farmId: string, caller: CallerCtx) {
    if (!caller.userId) throw new ForbiddenException('Thiếu thông tin caller');
    if (caller.role === Role.FARMER) {
      const farm = await this.farmRepo.findOne({ where: { id: farmId } });
      if (!farm) throw new NotFoundException('Farm không tồn tại');
      if (farm.owner_id !== caller.userId) {
        throw new ForbiddenException('Bạn không sở hữu trang trại này');
      }
    }
    const r = await this.responseRepo.findOne({
      where: { farm_id: farmId },
      order: { created_at: 'DESC' },
    });
    if (!r) return null;
    return this.findResponseByIdWithRelations(r.id);
  }

  async getResponseById(id: string, caller: CallerCtx) {
    const r = await this.findResponseByIdWithRelations(id);
    if (caller.role === Role.FARMER) {
      await this.assertOwnsResponseFarm(r.farm_id, caller);
    }
    return r;
  }

  // ── Review (Admin) ──

  async approveResponse(
    responseId: string,
    grantedTypeOverride: string | undefined,
    notes: string | undefined,
    caller: CallerCtx,
  ) {
    this.requireAdmin(caller);
    const response = await this.findResponseByIdWithRelations(responseId);
    if (response.status !== ChecklistResponseStatus.SUBMITTED) {
      throw new ConflictException('Chỉ duyệt được response đang SUBMITTED');
    }
    const grantedType = grantedTypeOverride || response.template?.cert_type;
    if (!grantedType) {
      throw new BadRequestException('Thiếu loại chứng nhận để cấp');
    }
    // Tận dụng workflow approve hiện có của FarmService (cập nhật Farm + notify owner)
    await this.farmService.approveCertification(response.farm_id, caller, grantedType);

    response.status = ChecklistResponseStatus.APPROVED;
    response.reviewed_at = new Date();
    response.reviewed_by = caller.userId;
    response.notes = notes?.trim() || null;
    await this.responseRepo.save(response);

    return this.findResponseByIdWithRelations(responseId);
  }

  async rejectResponse(
    responseId: string,
    reason: string,
    notes: string | undefined,
    caller: CallerCtx,
  ) {
    this.requireAdmin(caller);
    if (!reason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối');
    }
    const response = await this.findResponseByIdWithRelations(responseId);
    if (response.status !== ChecklistResponseStatus.SUBMITTED) {
      throw new ConflictException('Chỉ từ chối được response đang SUBMITTED');
    }
    await this.farmService.rejectCertification(response.farm_id, reason, caller);

    response.status = ChecklistResponseStatus.REJECTED;
    response.reviewed_at = new Date();
    response.reviewed_by = caller.userId;
    response.notes = (notes?.trim() || reason).trim();
    await this.responseRepo.save(response);

    return this.findResponseByIdWithRelations(responseId);
  }

  // ── Helpers ──

  private requireAdmin(caller: CallerCtx) {
    if (caller.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ admin được phép thực hiện thao tác này');
    }
  }

  private async assertOwnsResponseFarm(farmId: string, caller: CallerCtx) {
    if (caller.role === Role.ADMIN) return;
    const farm = await this.farmRepo.findOne({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Farm không tồn tại');
    if (farm.owner_id !== caller.userId) {
      throw new ForbiddenException('Bạn không sở hữu trang trại này');
    }
  }

  private async findTemplateByIdInternal(
    id: string,
    repo: Repository<CertificationTemplate>,
  ) {
    const tpl = await repo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.items', 'i')
      .where('t.id = :id', { id })
      .orderBy('i.order', 'ASC')
      .getOne();
    if (!tpl) throw new NotFoundException('Template không tồn tại');
    return tpl;
  }

  private async findResponseByIdWithRelations(id: string): Promise<ChecklistResponse> {
    const r = await this.responseRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.template', 't')
      .leftJoinAndSelect('t.items', 'ti')
      .leftJoinAndSelect('r.items', 'ri')
      .where('r.id = :id', { id })
      .orderBy('ti.order', 'ASC')
      .getOne();
    if (!r) throw new NotFoundException('Response không tồn tại');
    return r;
  }

  private async notifyAdminsSubmitted(farm: Farm, template: CertificationTemplate) {
    try {
      // Kích hoạt notification cho owner (admin sẽ thấy qua list pending farms)
      const payload: NotificationDispatchMessage = {
        user_id: farm.owner_id,
        type: NotificationType.CERT_CHECKLIST_SUBMITTED,
        title: 'Đã gửi checklist chứng nhận',
        message: `Checklist ${template.code} cho "${farm.name}" đã được gửi, đang chờ admin duyệt.`,
        link: `/farms/${farm.id}/certification`,
        data: JSON.stringify({ farm_id: farm.id, template_id: template.id }),
      };
      await this.amqp.publish(
        RABBIT_EXCHANGE,
        NOTIFICATION_DISPATCH_ROUTING_KEY,
        payload,
        { persistent: true, contentType: 'application/json' },
      );
    } catch (err) {
      this.logger.warn(
        `notifyAdminsSubmitted failed: ${(err as Error).message}`,
      );
    }
  }
}
