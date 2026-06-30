import Redis from 'ioredis';
import { Provider } from '@nestjs/common';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    return new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  },
};
