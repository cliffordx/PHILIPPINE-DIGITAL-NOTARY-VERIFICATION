import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  LOG_LEVEL: Joi.string().default('info'),
  FRAUD_HOURLY_THRESHOLD: Joi.number().default(30),
  FRAUD_DAILY_THRESHOLD: Joi.number().default(200),
});