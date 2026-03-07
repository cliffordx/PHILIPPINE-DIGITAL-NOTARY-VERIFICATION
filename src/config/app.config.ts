import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  fraudHourlyThreshold: parseInt(
    process.env.FRAUD_HOURLY_THRESHOLD || '20',
    10,
  ),
  fraudDailyThreshold: parseInt(
    process.env.FRAUD_DAILY_THRESHOLD || '100',
    10,
  ),
  fraudBurstWindow: parseInt(process.env.FRAUD_BURST_WINDOW || '300', 10),
  fraudBurstThreshold: parseInt(process.env.FRAUD_BURST_THRESHOLD || '10', 10),
}));
