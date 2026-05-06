import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Anchor } from '../entities/anchor.entity';
import { MerkleService } from './merkle.service';
import { BlockchainService } from './blockchain.service';
import { AnchorWorker } from './anchor.worker';
import { AnchorController } from './anchor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Anchor])],
  controllers: [AnchorController],
  providers: [MerkleService, BlockchainService, AnchorWorker],
  exports: [MerkleService, BlockchainService, AnchorWorker],
})
export class AnchorModule {}
