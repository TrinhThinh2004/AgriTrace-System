import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { ListAuditDto, ListAnchorsDto } from './dto/list-audit.dto';

interface AuditGrpcService {
  getLogs(req: ListAuditDto): Observable<any>;
  getLogBySeq(req: { seq_no: string }): Observable<any>;
  verifyLog(req: { seq_no: string }): Observable<any>;
  listAnchors(req: ListAnchorsDto): Observable<any>;
  getAnchor(req: { id: string }): Observable<any>;
}

@Injectable()
export class AuditService implements OnModuleInit {
  private grpc!: AuditGrpcService;
  // tiêm gRPC client đã được đăng ký với token 'AUDIT_SERVICE' trong PolicyModule
  constructor(@Inject('AUDIT_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.grpc = this.client.getService<AuditGrpcService>('AuditService');
  }

  list(filter: ListAuditDto) {
    return firstValueFrom(this.grpc.getLogs(filter));
  }

  getBySeq(seqNo: string) {
    return firstValueFrom(this.grpc.getLogBySeq({ seq_no: seqNo }));
  }

  verify(seqNo: string) {
    return firstValueFrom(this.grpc.verifyLog({ seq_no: seqNo }));
  }

  listAnchors(filter: ListAnchorsDto) {
    return firstValueFrom(this.grpc.listAnchors(filter));
  }

  getAnchor(id: string) {
    return firstValueFrom(this.grpc.getAnchor({ id }));
  }
}
