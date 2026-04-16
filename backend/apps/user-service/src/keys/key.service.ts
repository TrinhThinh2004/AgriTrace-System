import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserKey } from '../entities/user-key.entity';

@Injectable()
export class KeyService {
  constructor(
    @InjectRepository(UserKey)
    private readonly repo: Repository<UserKey>,
  ) {}


   // Hàm generateKeyPair sẽ tạo một cặp key mới cho user, đồng thời thu hồi tất cả key cũ (nếu có)
  async generateKeyPair(userId: string, algorithm = 'RSA-SHA256') {
    if (!userId) throw new ForbiddenException('Thiếu user_id');

    // Thu hồi tất cả key cũ của user 
    await this.repo.update(
      { user_id: userId, is_active: true },
      { is_active: false, revoked_at: new Date() },
    );

    // Tạo cặp key mới
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const key = this.repo.create({
      user_id: userId,
      public_key: publicKey,
      algorithm,
      is_active: true,
    });
    const saved = await this.repo.save(key);

    return {
      key_id: saved.id,
      public_key: publicKey,
      private_key: privateKey, // Chỉ trả 1 lần!
      algorithm,
    };
  }

  // Hàm getPublicKey sẽ trả về thông tin public key của key_id
  async getPublicKey(keyId: string) {
    if (!keyId) throw new NotFoundException('key_id là bắt buộc');
    const key = await this.repo.findOne({ where: { id: keyId } });
    if (!key) throw new NotFoundException(`Key ${keyId} không tìm thấy`);
    return {
      key_id: key.id,
      user_id: key.user_id,
      public_key: key.public_key,
      algorithm: key.algorithm,
      is_active: key.is_active,
    };
  }

 // Hàm listUserKeys sẽ trả về danh sách các key của user
  async listUserKeys(userId: string) {
    if (!userId) throw new ForbiddenException('Thiếu user_id');
    const keys = await this.repo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    return {
      keys: keys.map((k) => ({
        key_id: k.id,
        user_id: k.user_id,
        public_key: k.public_key,
        algorithm: k.algorithm,
        is_active: k.is_active,
      })),
    };
  }

  // Hàm listAllKeys: admin xem tất cả key toàn hệ thống
  async listAllKeys(
    page: number,
    limit: number,
    status?: string,
    userId?: string,
  ) {
    const qb = this.repo
      .createQueryBuilder('key')
      .leftJoinAndSelect('key.user', 'user')
      .orderBy('key.created_at', 'DESC');

    if (status === 'active') {
      qb.andWhere('key.is_active = :active', { active: true });
    } else if (status === 'revoked') {
      qb.andWhere('key.is_active = :active', { active: false });
    }

    if (userId) {
      qb.andWhere('key.user_id = :userId', { userId });
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((k) => ({
        key_id: k.id,
        user_id: k.user_id,
        public_key: k.public_key,
        algorithm: k.algorithm,
        is_active: k.is_active,
        created_at: k.created_at?.toISOString() ?? '',
        revoked_at: k.revoked_at?.toISOString() ?? '',
        user_email: k.user?.email ?? '',
        user_full_name: k.user?.full_name ?? '',
        user_role: k.user?.role ?? '',
      })),
      pagination: { page, limit, total },
    };
  }

  // Hàm adminRevokeKey: admin thu hồi bất kỳ key nào (không check user_id)
  async adminRevokeKey(keyId: string) {
    if (!keyId) throw new NotFoundException('key_id là bắt buộc');
    const key = await this.repo.findOne({ where: { id: keyId } });
    if (!key) throw new NotFoundException(`Key ${keyId} không tìm thấy`);
    if (!key.is_active) {
      throw new ConflictException('Key đã bị thu hồi trước đó');
    }
    key.is_active = false;
    key.revoked_at = new Date();
    await this.repo.save(key);
    return { message: 'Thu hồi key thành công (admin)' };
  }

  // Hàm revokeKey sẽ thu hồi một key cụ thể của user
  async revokeKey(keyId: string, userId: string) {
    if (!keyId) throw new NotFoundException('key_id là bắt buộc');
    const key = await this.repo.findOne({ where: { id: keyId } });
    if (!key) throw new NotFoundException(`Key ${keyId} không tìm thấy`);
    if (key.user_id !== userId) {
      throw new ForbiddenException('Key không thuộc user này');
    }
    if (!key.is_active) {
      throw new ConflictException('Key đã bị thu hồi trước đó');
    }
    key.is_active = false;
    key.revoked_at = new Date();
    await this.repo.save(key);
    return { message: 'Thu hồi key thành công' };
  }
}
