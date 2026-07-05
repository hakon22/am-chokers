import { DataSource } from 'typeorm';
import { createClient, type RedisClientType } from 'redis';
import { Container, Singleton } from 'typescript-ioc';

import { entities } from '@server/db/entities';
import { TypeormLogger } from '@server/db/typeorm.logger';
import {
  SERVER_SERVICES_INIT_STATE_KEY,
  SHARED_DATA_SOURCE_KEY,
  SHARED_REDIS_CLIENT_KEY,
  SHARED_REDIS_SUBSCRIBE_CLIENT_KEY,
} from '@server/runtime/server-infrastructure-keys';
import 'dotenv/config';

export interface ServerServicesInitStateInterface {
  initPromise: Promise<void> | null;
  isReady: boolean;
}

type GlobalInfrastructureRecord = Record<PropertyKey, unknown>;

@Singleton
export class ServerInfrastructureService {
  private readonly databaseEnvironment = {
    DB: process.env.DB ?? 'LOCAL',
    DB_LOCAL: process.env.DB_LOCAL ?? '',
    DB_HOST: process.env.DB_HOST ?? '',
    USER_DB_LOCAL: process.env.USER_DB_LOCAL ?? '',
    PASSWORD_DB_LOCAL: process.env.PASSWORD_DB_LOCAL ?? '',
    USER_DB_HOST: process.env.USER_DB_HOST ?? '',
    PASSWORD_DB_HOST: process.env.PASSWORD_DB_HOST ?? '',
    IS_DOCKER: process.env.IS_DOCKER ?? '',
    NODE_ENV: process.env.NODE_ENV,
  };

  private readonly databaseHost = (
    this.databaseEnvironment.NODE_ENV === 'production' && this.databaseEnvironment.DB !== 'LOCAL'
  ) || !this.databaseEnvironment.IS_DOCKER ? 'localhost' : 'host.docker.internal';

  /**
   * Возвращает конфигурацию подключения к Redis для socket-опций
   * @returns host и port Redis
   */
  public getRedisConfig = (): { host: string; port: number; } => ({
    host: this.databaseHost,
    port: 6379,
  });

  /**
   * Возвращает общий DataSource процесса (lazy-init на globalThis)
   * @returns singleton DataSource для Express и Next SSR
   */
  public getSharedDataSource = (): DataSource => {
    const globalRecord = this.getGlobalInfrastructureRecord();

    if (!(SHARED_DATA_SOURCE_KEY in globalRecord)) {
      globalRecord[SHARED_DATA_SOURCE_KEY] = this.createSharedDataSource();
    }

    return globalRecord[SHARED_DATA_SOURCE_KEY] as DataSource;
  };

  /**
   * Возвращает общий основной Redis-клиент процесса (lazy-init на globalThis)
   * @returns singleton Redis-клиент без активного connect
   */
  public getSharedRedisClient = (): RedisClientType => {
    const globalRecord = this.getGlobalInfrastructureRecord();

    if (!(SHARED_REDIS_CLIENT_KEY in globalRecord)) {
      globalRecord[SHARED_REDIS_CLIENT_KEY] = createClient(this.getRedisCommonOptions())
        .on('error', (error) => console.log('Невозможно подключиться к Redis', error));
    }

    return globalRecord[SHARED_REDIS_CLIENT_KEY] as RedisClientType;
  };

  /**
   * Возвращает общий Redis-клиент для подписок (lazy-init на globalThis)
   * @returns singleton Redis-клиент подписок без активного connect
   */
  public getSharedRedisSubscribeClient = (): RedisClientType => {
    const globalRecord = this.getGlobalInfrastructureRecord();

    if (!(SHARED_REDIS_SUBSCRIBE_CLIENT_KEY in globalRecord)) {
      globalRecord[SHARED_REDIS_SUBSCRIBE_CLIENT_KEY] = createClient(this.getRedisCommonOptions())
        .on('error', (error) => console.log('Ошибка при попытке подписаться на события Redis', error));
    }

    return globalRecord[SHARED_REDIS_SUBSCRIBE_CLIENT_KEY] as RedisClientType;
  };

  /**
   * Возвращает состояние инициализации серверных сервисов на globalThis
   * @returns объект с initPromise и isReady, общий для Express и SSR
   */
  public getServerServicesInitState = (): ServerServicesInitStateInterface => {
    const globalRecord = this.getGlobalInfrastructureRecord();

    if (!(SERVER_SERVICES_INIT_STATE_KEY in globalRecord)) {
      globalRecord[SERVER_SERVICES_INIT_STATE_KEY] = {
        initPromise: null,
        isReady: false,
      } satisfies ServerServicesInitStateInterface;
    }

    return globalRecord[SERVER_SERVICES_INIT_STATE_KEY] as ServerServicesInitStateInterface;
  };

  /**
   * Возвращает запись globalThis для хранения инфраструктуры процесса
   * @returns объект globalThis как словарь ключей инфраструктуры
   */
  private getGlobalInfrastructureRecord = (): GlobalInfrastructureRecord => globalThis as GlobalInfrastructureRecord;

  /**
   * Возвращает общие опции Redis-клиента (socket и prefix)
   * @returns опции для createClient
   */
  private getRedisCommonOptions = () => ({
    socket: this.getRedisConfig(),
    prefix: `${process.env.NEXT_PUBLIC_APP_NAME ?? 'myapp'}:${process.env.NODE_ENV ?? 'development'}:`.toUpperCase(),
  });

  /**
   * Создаёт новый экземпляр DataSource с настройками проекта
   * @returns неинициализированный DataSource TypeORM
   */
  private createSharedDataSource = (): DataSource => {
    const {
      DB,
      DB_LOCAL,
      DB_HOST,
      USER_DB_LOCAL,
      PASSWORD_DB_LOCAL,
      USER_DB_HOST,
      PASSWORD_DB_HOST,
      NODE_ENV,
    } = this.databaseEnvironment;

    return new DataSource({
      type: 'postgres',
      host: this.databaseHost,
      port: 5432,
      username: DB === 'LOCAL' ? USER_DB_LOCAL : USER_DB_HOST,
      password: DB === 'LOCAL' ? PASSWORD_DB_LOCAL : PASSWORD_DB_HOST,
      database: DB === 'LOCAL' ? DB_LOCAL : DB_HOST,
      logger: new TypeormLogger(),
      schema: 'chokers',
      synchronize: false,
      logging: true,
      entities,
      subscribers: [],
      migrations: [`server/db/migrations/*.${NODE_ENV === 'production' ? 'js' : 'ts'}`],
    });
  };
}

/**
 * Возвращает singleton ServerInfrastructureService из IOC-контейнера
 * @returns экземпляр ServerInfrastructureService
 */
export const getServerInfrastructureService = () => Container.get(ServerInfrastructureService);
