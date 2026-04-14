import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PolicyModule } from '../../common/policy.module';
  import { UserService } from './user.service';

@Module({
  imports: [PolicyModule],
  controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
