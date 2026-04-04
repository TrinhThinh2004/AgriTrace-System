import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserKey } from './entities/user-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserKey])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class UserModule {}
