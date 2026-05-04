import { Controller, Get, Param, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { AuditService } from './audit.service';
import { ListAuditDto, ListAnchorsDto } from './dto/list-audit.dto';

@Roles(Role.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  list(@Query() query: ListAuditDto) {
    return this.service.list(query);
  }
  // lấy chi tiết log audit theo seq_no
  @Get('anchors')
  listAnchors(@Query() query: ListAnchorsDto) {
    return this.service.listAnchors(query);
  }

  // lấy chi tiết thông tin anchor theo id
  @Get('anchors/:id')
  getAnchor(@Param('id') id: string) {
    return this.service.getAnchor(id);
  }

  
  @Get(':seq_no')
  getBySeq(@Param('seq_no') seqNo: string) {
    return this.service.getBySeq(seqNo);
  }
  
  @Get(':seq_no/verify')
  verify(@Param('seq_no') seqNo: string) {
    return this.service.verify(seqNo);
  }
}
