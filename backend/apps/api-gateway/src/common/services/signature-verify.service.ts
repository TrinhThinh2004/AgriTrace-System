import * as crypto from 'crypto';
import {
  Injectable,
  Inject,
  OnModuleInit,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface UserServiceGrpc {
  getPublicKey(data: { key_id: string }): Observable<{
    key_id: string;
    user_id: string;
    public_key: string;
    algorithm: string;
    is_active: boolean;
  }>;
}

@Injectable()
export class SignatureVerifyService implements OnModuleInit {
  private userService!: UserServiceGrpc;

  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService =
      this.userClient.getService<UserServiceGrpc>('UserService');
  }
  // Hàm verify chữ ký số
  async verifySignature(params: {
    signer_key_id: string;
    digital_signature: string;
    canonical_data: string;
    expected_user_id: string;
  }): Promise<void> {
    // Lấy public key từ User Service
    const keyResponse = await firstValueFrom(
      this.userService.getPublicKey({ key_id: params.signer_key_id }),
    );
    //  Check key có thuộc user này không
    if (keyResponse.user_id !== params.expected_user_id) {
      throw new ForbiddenException('Key không thuộc user này');
    }

    //  Check key còn active
    if (!keyResponse.is_active) {
      throw new BadRequestException('Key đã bị thu hồi');
    }

    // Verify signature bằng public key
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(params.canonical_data);
    const isValid = verifier.verify(
      keyResponse.public_key,
      params.digital_signature,
      'base64',
    );

    if (!isValid) {
      throw new BadRequestException('Chữ ký số không hợp lệ');
    }
  }

  buildActivityLogCanonical(log: {
    id: string;
    batch_id: string;
    activity_type: string;
    performed_at: string;
  }): string {
    return `SIGN:activity_log:${log.id}:${log.batch_id}:${log.activity_type}:${log.performed_at}`;
  }

  buildInspectionCanonical(ins: {
    id: string;
    batch_id: string;
    inspection_type: string;
    result: string;
    conducted_at: string;
  }): string {
    return `SIGN:inspection:${ins.id}:${ins.batch_id}:${ins.inspection_type}:${ins.result}:${ins.conducted_at}`;
  }
}
