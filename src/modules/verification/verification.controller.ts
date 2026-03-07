import { Body, Controller, Post, Req, Version } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { VerificationService } from './verification.service';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Version('1')
  @Post()
  async verify(@Body() dto: VerifyDocumentDto, @Req() req: any) {
    return this.verificationService.verify(dto, req.ip);
  }
}