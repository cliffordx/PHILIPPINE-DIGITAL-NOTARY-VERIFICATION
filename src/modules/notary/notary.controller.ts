import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateNotarizationDto } from './dto/create-notarization.dto';
import { LawyerHistoryQueryDto } from './dto/lawyer-history-query.dto';
import { NotaryService } from './notary.service';

@ApiTags('notary')
@ApiBearerAuth()
@Controller('notary')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotaryController {
  constructor(private readonly notaryService: NotaryService) {}

  @Version('1')
  @Post('entries')
  @Roles(Role.NOTARY, Role.IBP_ADMIN)
  async registerEntry(@Body() dto: CreateNotarizationDto, @Req() req: any) {
    return this.notaryService.registerNotarization(dto, req.user, req.ip);
  }

  @Version('1')
  @Get('history')
  @Roles(Role.NOTARY, Role.IBP_ADMIN, Role.AUDITOR)
  async getHistory(@Query() query: LawyerHistoryQueryDto, @Req() req: any) {
    return this.notaryService.getLawyerHistory(query, req.user);
  }
}