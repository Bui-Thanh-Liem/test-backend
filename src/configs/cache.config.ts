import { registerAs } from '@nestjs/config';
import { RedisOptions } from 'ioredis';
import { CONSTANT_CONFIG } from 'src/constants/config.constant';

export default registerAs(
  CONSTANT_CONFIG.REDIS,
  (): RedisOptions => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    // password: process.env.REDIS_PASSWORD,
  }),
);
