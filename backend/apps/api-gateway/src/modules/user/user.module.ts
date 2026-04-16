import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { KeyController } from './key.controller';
import { AdminKeyController } from './admin-key.controller';
import { PolicyModule } from '../../common/policy.module';
import { UserService } from './user.service';
import { KeyService } from './key.service';
import { SignatureVerifyService } from '../../common/services/signature-verify.service';

@Module({
  imports: [PolicyModule],
  controllers: [UserController, KeyController, AdminKeyController],
  providers: [UserService, KeyService, SignatureVerifyService],
  exports: [UserService, KeyService, SignatureVerifyService],
})
export class UserModule {}
