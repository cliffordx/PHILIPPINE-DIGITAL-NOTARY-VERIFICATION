import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RequestActor } from '../../common/interfaces/request-actor.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FraudAlertQueryDto } from './dto/fraud-alert-query.dto';
import { FraudService } from './fraud.service';

@ApiTags('fraud')
@ApiBearerAuth()
@Controller('fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Version('1')
  @Get('alerts')
  @Roles(Role.AUDITOR, Role.IBP_ADMIN)
  getAlerts(@Query() query: FraudAlertQueryDto) {
    return this.fraudService.getAlerts(query);
  }

  @Version('1')
  @Patch('alerts/:id/resolve')
  @Roles(Role.AUDITOR, Role.IBP_ADMIN)
  resolveAlert(@Param('id') id: string, @Req() req: { user: RequestActor }) {
    return this.fraudService.resolveAlert(id, req.user);
  }
}
