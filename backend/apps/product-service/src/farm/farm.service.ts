import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Farm } from '../entities/farm.entity';
import { Batch } from '../entities/batch.entity';
import {
  CertificationStatus,
  FarmStatus,
  Role,
  NotificationType,
  RABBIT_EXCHANGE,
  NOTIFICATION_DISPATCH_ROUTING_KEY,
  NotificationDispatchMessage,
} from '@app/shared';

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
  certification_status?: string;
  page?: number;
  limit?: number;
}

interface CallerCtx {
  userId: string | null;
  role: string | null;
}

const REQUESTABLE_TYPES: CertificationStatus[] = [
  CertificationStatus.VIETGAP,
  CertificationStatus.GLOBALGAP,
  CertificationStatus.ORGANIC,
];

function toNumberOrNull(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Service chứa business logic
@Injectable()
export class FarmService {
  private readonly logger = new Logger(FarmService.name);

  constructor(
    @InjectRepository(Farm)
    private readonly repo: Repository<Farm>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    private readonly amqp: AmqpConnection,
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

  // Method list với filter theo owner_id, status, certification_status và pagination
  async list({
    owner_id,
    status,
    certification_status,
    page = 1,
    limit = 20,
  }: ListParams) {
    const qb = this.repo.createQueryBuilder('f');
    if (owner_id) qb.andWhere('f.owner_id = :owner_id', { owner_id });
    if (status) qb.andWhere('f.status = :status', { status });
    if (certification_status)
      qb.andWhere('f.certification_status = :cert', {
        cert: certification_status,
      });
    qb.orderBy('f.updated_at', 'DESC');

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    qb.skip((safePage - 1) * safeLimit).take(safeLimit);

    const [items, total] = await qb.getManyAndCount();
    return { items, page: safePage, limit: safeLimit, total };
  }

  // ── Certification workflow ──

  async requestCertification(
    farmId: string,
    requestedType: string,
    caller: CallerCtx,
  ) {
    if (!caller?.userId) throw new ForbiddenException('Thiếu thông tin caller');

    const type = requestedType as CertificationStatus;
    if (!REQUESTABLE_TYPES.includes(type)) {
      throw new BadRequestException(
        `Loại chứng nhận không hợp lệ: chỉ chấp nhận VIETGAP, GLOBALGAP, ORGANIC`,
      );
    }

    const farm = await this.findById(farmId);

    // Farmer chỉ được xin cho farm của mình
    if (caller.role === Role.FARMER && farm.owner_id !== caller.userId) {
      throw new ForbiddenException('Bạn không sở hữu trang trại này');
    }

    if (farm.certification_status !== CertificationStatus.NONE) {
      throw new ConflictException(
        farm.certification_status === CertificationStatus.PENDING
          ? 'Trang trại đang chờ duyệt yêu cầu trước đó'
          : `Trang trại đã có chứng nhận ${farm.certification_status}. Hãy huỷ chứng nhận hiện tại trước khi xin loại mới.`,
      );
    }

    farm.certification_status = CertificationStatus.PENDING;
    farm.requested_certification_type = type;
    farm.certified_at = null;
    farm.certified_by = null;
    farm.reject_reason = null;

    const saved = await this.repo.save(farm);
    return saved;
  }

  async approveCertification(
    farmId: string,
    caller: CallerCtx,
    grantedTypeOverride?: string,
  ) {
    if (!caller?.userId) throw new ForbiddenException('Thiếu thông tin caller');
    if (caller.role !== Role.ADMIN)
      throw new ForbiddenException('Chỉ admin mới được duyệt chứng nhận');

    const farm = await this.findById(farmId);

    if (farm.certification_status !== CertificationStatus.PENDING) {
      throw new ConflictException(
        'Chỉ có thể duyệt yêu cầu đang ở trạng thái PENDING',
      );
    }

    const candidate =
      (grantedTypeOverride as CertificationStatus) ||
      farm.requested_certification_type;
    if (!candidate) {
      throw new BadRequestException(
        'Vui lòng chọn loại chứng nhận để cấp (VIETGAP, GLOBALGAP hoặc ORGANIC)',
      );
    }
    if (!REQUESTABLE_TYPES.includes(candidate)) {
      throw new BadRequestException(
        `Loại chứng nhận không hợp lệ: ${candidate}`,
      );
    }

    const grantedType = candidate;
    farm.certification_status = grantedType;
    farm.certified_at = new Date();
    farm.certified_by = caller.userId;
    farm.requested_certification_type = null;
    farm.reject_reason = null;

    const saved = await this.repo.save(farm);

    void this.notifyOwner(
      saved,
      NotificationType.CERTIFICATION_APPROVED,
      'Yêu cầu chứng nhận đã được duyệt',
      `Trang trại "${saved.name}" đã được cấp chứng nhận ${grantedType}.`,
    );

    return saved;
  }

  async rejectCertification(
    farmId: string,
    reason: string,
    caller: CallerCtx,
  ) {
    if (!caller?.userId) throw new ForbiddenException('Thiếu thông tin caller');
    if (caller.role !== Role.ADMIN)
      throw new ForbiddenException('Chỉ admin mới được từ chối chứng nhận');
    if (!reason?.trim())
      throw new BadRequestException('Vui lòng nhập lý do từ chối');

    const farm = await this.findById(farmId);

    if (farm.certification_status !== CertificationStatus.PENDING) {
      throw new ConflictException(
        'Chỉ có thể từ chối yêu cầu đang ở trạng thái PENDING',
      );
    }

    const requestedType = farm.requested_certification_type;
    farm.certification_status = CertificationStatus.NONE;
    farm.requested_certification_type = null;
    farm.certified_at = null;
    farm.certified_by = caller.userId;
    farm.reject_reason = reason.trim();

    const saved = await this.repo.save(farm);

    void this.notifyOwner(
      saved,
      NotificationType.CERTIFICATION_REJECTED,
      'Yêu cầu chứng nhận bị từ chối',
      `Yêu cầu cấp chứng nhận ${requestedType ?? ''} cho "${saved.name}" đã bị từ chối: ${saved.reject_reason}`,
    );

    return saved;
  }

  // Publish event lên RabbitMQ  — user-service consume bất đồng bộ.
  // Nếu user-service down, message nằm trong queue đến khi service lên lại.
  private async notifyOwner(
    farm: Farm,
    type: NotificationType,
    title: string,
    message: string,
  ) {
    try {
      const payload: NotificationDispatchMessage = {
        user_id: farm.owner_id,
        type,
        title,
        message,
        link: `/farms`,
        data: JSON.stringify({
          farm_id: farm.id,
          certification_status: farm.certification_status,
        }),
      };
      await this.amqp.publish(
        RABBIT_EXCHANGE,
        NOTIFICATION_DISPATCH_ROUTING_KEY,
        payload,
        { persistent: true, contentType: 'application/json' },
      );
    } catch (err) {
      this.logger.warn(
        `Notify publish failed for farm ${farm.id}: ${(err as Error).message}`,
      );
    }
  }
}
