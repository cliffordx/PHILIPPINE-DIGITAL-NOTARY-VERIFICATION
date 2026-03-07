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
import { FraudDetectionService } from './fraud-detection.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { LawyerRole } from '../../entities/lawyer.entity';

@ApiTags('Fraud Detection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(LawyerRole.IBP_ADMIN, LawyerRole.AUDITOR)
@Controller('fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudDetectionService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'Get fraud-flagged documents' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFraudAlerts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.fraudService.getFraudAlerts(page, limit);
  }

  @Get('run-checks')
  @ApiOperation({ summary: 'Manually trigger fraud detection checks' })
  async runChecks() {
    const alerts = await this.fraudService.runFraudChecks();
    return { message: 'Fraud checks completed', alertCount: 0 };
  }
}
