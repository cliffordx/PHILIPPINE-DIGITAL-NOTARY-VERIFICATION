import { Controller, Get, Version } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Version('1')
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'digital-notary-verification-api',
      timestamp: new Date().toISOString(),
    };
  }
}