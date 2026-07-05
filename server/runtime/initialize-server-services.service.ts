import 'reflect-metadata';

import { Container, Singleton } from 'typescript-ioc';

import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { ServerInfrastructureService } from '@server/runtime/server-infrastructure.service';

export interface InitializeServerServicesOptionsInterface {
  redisWithoutSubscribles?: boolean;
}

@Singleton
export class InitializeServerServicesService {
  private readonly serverInfrastructureService = Container.get(ServerInfrastructureService);

  /**
   * Инициализирует PostgreSQL и Redis — единая точка входа для Express и Next SSR
   * @param options - опции инициализации Redis (без подписок для SSR и API)
   * @returns Promise по завершении инициализации (идемпотентно на уровне процесса)
   */
  public initialize = async (options: InitializeServerServicesOptionsInterface = {}): Promise<void> => {
    const initState = this.serverInfrastructureService.getServerServicesInitState();
    const databaseService = Container.get(DatabaseService);
    const redisService = Container.get(RedisService);

    if (!initState.isReady) {
      if (initState.initPromise === null) {
        initState.initPromise = (async () => {
          await databaseService.init();
          await redisService.init({ withoutSubscribles: options.redisWithoutSubscribles });
          initState.isReady = true;
        })();
      }

      await initState.initPromise;
    }

    databaseService.bindActiveRecordEntities();
  };
}

/**
 * Возвращает singleton InitializeServerServicesService из IOC-контейнера
 * @returns экземпляр InitializeServerServicesService
 */
export const getInitializeServerServicesService = () => Container.get(InitializeServerServicesService);
