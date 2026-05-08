import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Anchor } from '../entities/anchor.entity';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { HashChainService } from './hash-chain.service';
import { WormBootstrapService } from './worm-bootstrap.service';
import { AnchorModule } from '../anchor/anchor.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Anchor]), AnchorModule],
  controllers: [AuditController],
  providers: [AuditService, HashChainService, WormBootstrapService],
  exports: [AuditService, HashChainService],
})
export class AuditModule {}
