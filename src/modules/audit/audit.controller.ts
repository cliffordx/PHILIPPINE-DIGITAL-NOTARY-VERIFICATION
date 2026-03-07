import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Version('1')
  @Get('logs')
  @Roles(Role.AUDITOR, Role.IBP_ADMIN)
  getLogs(@Query() query: AuditLogQueryDto) {
    return this.auditService.getLogs(query);
  }

  @Version('1')
  @Get('logs/:id')
  @Roles(Role.AUDITOR, Role.IBP_ADMIN)
  getLogById(@Param('id') id: string) {
    return this.auditService.getLogById(id);
  }
}
