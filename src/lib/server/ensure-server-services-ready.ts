import 'reflect-metadata';
import 'dotenv/config';

import { Container } from 'typescript-ioc';

import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { isNextProductionBuild } from '@/lib/server/is-next-production-build';

let isServerServicesReady = false;
let serverServicesInitPromise: Promise<void> | null = null;

/**
 * Инициализирует PostgreSQL и Redis перед прямыми вызовами сервисов в SSR/ISR
 * @returns Promise по завершении инициализации (идемпотентно)
 */
export const ensureServerServicesReady = async (): Promise<void> => {
  if (isNextProductionBuild()) {
    return;
  }

  if (isServerServicesReady) {
    return;
  }

  if (serverServicesInitPromise !== null) {
    await serverServicesInitPromise;
    return;
  }

  serverServicesInitPromise = (async () => {
    const databaseService = Container.get(DatabaseService);
    const redisService = Container.get(RedisService);

    await databaseService.init();
    await redisService.init({ withoutSubscribles: true });

    isServerServicesReady = true;
  })();

  await serverServicesInitPromise;
};
