import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { VerificationService } from './verification.service';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { LawyerRole } from '../../entities/lawyer.entity';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('verify')
  @ApiOperation({
    summary: 'Verify a notarized document by serial number or hash',
  })
  async verify(@Body() dto: VerifyDocumentDto, @Req() req: Request) {
    return this.verificationService.verifyDocument(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('history/:documentId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(LawyerRole.IBP_ADMIN, LawyerRole.AUDITOR, LawyerRole.NOTARY)
  @ApiOperation({ summary: 'Get verification history for a document' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVerificationHistory(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.verificationService.getVerificationHistory(
      documentId,
      page,
      limit,
    );
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(LawyerRole.IBP_ADMIN, LawyerRole.AUDITOR)
  @ApiOperation({ summary: 'Get verification statistics' })
  async getStats() {
    return this.verificationService.getVerificationStats();
  }
}
