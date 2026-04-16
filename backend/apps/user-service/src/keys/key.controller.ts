import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { KeyService } from './key.service';

@Controller()
export class KeyController {
  constructor(private readonly keyService: KeyService) {}

  @GrpcMethod('UserService', 'GenerateKeyPair')
  async generateKeyPair(data: { user_id: string; algorithm?: string }) {
    try {
      return await this.keyService.generateKeyPair(
        data.user_id,
        data.algorithm || 'RSA-SHA256',
      );
    } catch (error) {
      console.error('[User Service] Error in GenerateKeyPair:', error);
      throw error;
    }
  }

  @GrpcMethod('UserService', 'GetPublicKey')
  async getPublicKey(data: { key_id: string }) {
    try {
      return await this.keyService.getPublicKey(data.key_id);
    } catch (error) {
      console.error('[User Service] Error in GetPublicKey:', error);
      throw error;
    }
  }

  @GrpcMethod('UserService', 'ListUserKeys')
  async listUserKeys(data: { user_id: string }) {
    try {
      return await this.keyService.listUserKeys(data.user_id);
    } catch (error) {
      console.error('[User Service] Error in ListUserKeys:', error);
      throw error;
    }
  }

  @GrpcMethod('UserService', 'RevokeKey')
  async revokeKey(data: { key_id: string; user_id: string }) {
    try {
      return await this.keyService.revokeKey(data.key_id, data.user_id);
    } catch (error) {
      console.error('[User Service] Error in RevokeKey:', error);
      throw error;
    }
  }

  @GrpcMethod('UserService', 'ListAllKeys')
  async listAllKeys(data: {
    page?: number;
    limit?: number;
    status?: string;
    user_id?: string;
  }) {
    try {
      return await this.keyService.listAllKeys(
        data.page || 1,
        data.limit || 50,
        data.status,
        data.user_id,
      );
    } catch (error) {
      console.error('[User Service] Error in ListAllKeys:', error);
      throw error;
    }
  }

  @GrpcMethod('UserService', 'AdminRevokeKey')
  async adminRevokeKey(data: { key_id: string }) {
    try {
      return await this.keyService.adminRevokeKey(data.key_id);
    } catch (error) {
      console.error('[User Service] Error in AdminRevokeKey:', error);
      throw error;
    }
  }
}
