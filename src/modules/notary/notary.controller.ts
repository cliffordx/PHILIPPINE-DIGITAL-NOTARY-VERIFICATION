import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { NotaryService } from './notary.service';
import { CreateNotarizationDto } from './dto/create-notarization.dto';
import { CreateRegisterDto } from './dto/create-register.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { LawyerRole } from '../../entities/lawyer.entity';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Notary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notary')
export class NotaryController {
  constructor(private readonly notaryService: NotaryService) {}

  @Post('registers')
  @Roles(LawyerRole.NOTARY)
  @ApiOperation({ summary: 'Create a new notarial register book' })
  async createRegister(
    @Body() dto: CreateRegisterDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.notaryService.createRegister(req.user.sub, dto, req.ip);
  }

  @Get('registers')
  @Roles(LawyerRole.NOTARY)
  @ApiOperation({ summary: 'Get all registers for the authenticated notary' })
  async getMyRegisters(@Req() req: Request & { user: JwtPayload }) {
    return this.notaryService.getLawyerRegisters(req.user.sub);
  }

  @Get('registers/:id')
  @ApiOperation({ summary: 'Get a specific notarial register' })
  @ApiParam({ name: 'id', description: 'Register UUID' })
  async getRegister(@Param('id', ParseUUIDPipe) id: string) {
    return this.notaryService.getRegister(id);
  }

  @Post('documents')
  @Roles(LawyerRole.NOTARY)
  @ApiOperation({ summary: 'Register a new notarization entry' })
  @ApiBody({ type: CreateNotarizationDto })
  async notarize(
    @Body() dto: CreateNotarizationDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.notaryService.notarizeDocument(req.user.sub, dto, req.ip);
  }

  @Get('documents')
  @Roles(LawyerRole.NOTARY)
  @ApiOperation({
    summary: 'Get notarization history for the authenticated notary',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyDocuments(
    @Req() req: Request & { user: JwtPayload },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.notaryService.getLawyerDocuments(req.user.sub, page, limit);
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get a specific notarized document by ID' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async getDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.notaryService.getDocumentById(id);
  }

  @Delete('documents/:id')
  @Roles(LawyerRole.NOTARY, LawyerRole.IBP_ADMIN)
  @ApiOperation({ summary: 'Revoke a notarized document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async revokeDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.notaryService.revokeDocument(id, req.user.sub, reason, req.ip);
  }
}
