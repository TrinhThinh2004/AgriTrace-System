import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Anchor } from '../entities/anchor.entity';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { HashChainService } from './hash-chain.service';
import { WormBootstrapService } from './worm-bootstrap.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Anchor])],
  controllers: [AuditController],
  providers: [AuditService, HashChainService, WormBootstrapService],
  exports: [AuditService, HashChainService],
})
export class AuditModule {}
