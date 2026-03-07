import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { LawyerRole } from '../../entities/lawyer.entity';
import { AuditAction } from '../../entities/audit-log.entity';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(LawyerRole.IBP_ADMIN, LawyerRole.AUDITOR)
  @ApiOperation({ summary: 'Retrieve audit logs (Admin/Auditor only)' })
  @ApiQuery({ name: 'lawyerId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAuditLogs(
    @Query('lawyerId') lawyerId?: string,
    @Query('action') action?: AuditAction,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.auditService.getAuditLogs(lawyerId, action, page, limit);
  }

  @Get('integrity')
  @Roles(LawyerRole.IBP_ADMIN, LawyerRole.AUDITOR)
  @ApiOperation({ summary: 'Verify audit log chain integrity' })
  async verifyIntegrity() {
    return this.auditService.verifyChainIntegrity();
  }
}
