import 'reflect-metadata';
import 'dotenv/config';

import { getInitializeServerServicesService } from '@server/runtime/initialize-server-services.service';
import { isNextProductionBuild } from '@/lib/server/is-next-production-build';

/**
 * Инициализирует PostgreSQL и Redis перед прямыми вызовами сервисов в SSR/ISR
 * @returns Promise по завершении инициализации (идемпотентно на уровне процесса)
 */
export const ensureServerServicesReady = async (): Promise<void> => {
  if (isNextProductionBuild()) {
    return;
  }

  await getInitializeServerServicesService().initialize({ redisWithoutSubscribles: true });
};
