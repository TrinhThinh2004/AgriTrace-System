import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserKey } from '../entities/user-key.entity';
import { KeyService } from './key.service';
import { KeyController } from './key.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserKey])],
  controllers: [KeyController],
  providers: [KeyService],
  exports: [KeyService],
})
export class KeyModule {}
