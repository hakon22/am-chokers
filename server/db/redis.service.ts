import { RedisClientType } from 'redis';
import { Container, Singleton } from 'typescript-ioc';

import { redisConfig } from '@server/db/database.service';
import { LoggerService } from '@server/services/app/logger.service';
import { ServerInfrastructureService } from '@server/runtime/server-infrastructure.service';
import { RedisKeyEnum } from '@server/types/db/enums/redis-key.enum';

@Singleton
export class RedisService {
  private readonly loggerService = Container.get(LoggerService);

  private readonly serverInfrastructureService = Container.get(ServerInfrastructureService);

  private readonly TAG = 'RedisService';

  public commonOptions = {
    socket: redisConfig,
    prefix: `${process.env.NEXT_PUBLIC_APP_NAME ?? 'myapp'}:${process.env.NODE_ENV ?? 'development'}:`.toUpperCase(),
  };

  /**
   * Возвращает подключённый общий Redis-клиент процесса
   * @returns активный Redis-клиент
   */
  private getConnectedRedisClient = (): RedisClientType => {
    const sharedRedisClient = this.serverInfrastructureService.getSharedRedisClient();

    if (!sharedRedisClient.isOpen) {
      throw new Error('Redis connection is not initialized. Please call init() first.');
    }

    return sharedRedisClient;
  };

  /**
   * Возвращает подключённый Redis-клиент подписок процесса
   * @returns активный Redis-клиент подписок
   */
  public get subscribeRedis(): RedisClientType {
    const sharedSubscribeRedisClient = this.serverInfrastructureService.getSharedRedisSubscribeClient();

    if (!sharedSubscribeRedisClient.isOpen) {
      throw new Error('Redis subscribe connection is not initialized. Please call init() first.');
    }

    return sharedSubscribeRedisClient;
  }

  /**
   * Инициализирует подключение к Redis (идемпотентно на общих клиентах процесса)
   * @param options - withoutSubscribles: не поднимать клиент подписок
   * @returns Promise по завершении подключения
   */
  public init = async (options?: { withoutSubscribles?: boolean; }): Promise<void> => {
    const sharedRedisClient = this.serverInfrastructureService.getSharedRedisClient();
    const wasRedisAlreadyConnected = sharedRedisClient.isOpen;

    if (!sharedRedisClient.isOpen) {
      await sharedRedisClient.connect();
    }

    if (!options?.withoutSubscribles) {
      const sharedSubscribeRedisClient = this.serverInfrastructureService.getSharedRedisSubscribeClient();

      if (!sharedSubscribeRedisClient.isOpen) {
        await sharedSubscribeRedisClient.connect();
      }
    }

    if (!wasRedisAlreadyConnected) {
      console.log('Соединение с Redis было успешно установлено');
    }
  };

  /** Получение значения из кеша
   * @param key ключ
   */
  public get = async <T>(key: string): Promise<T | null> => {
    const value = await this.getConnectedRedisClient().get(`${this.commonOptions.prefix}${key}`);

    return typeof value === 'string' ? JSON.parse(value) : null;
  };

  /** Запись значения в кеш
   * @param key ключ
   * @param value значение
   */
  public set = async (key: string, value: any) => {
    const newValue = JSON.stringify(value);
    const length = newValue.length;
    this.loggerService.info(this.TAG, `Сохранение значения по ключу ${key}:`, length > 300 ? `${newValue.substring(0, 300)}...[${length - 300} more characters]` : newValue);
    await this.getConnectedRedisClient().set(`${this.commonOptions.prefix}${key}`, newValue);
  };

  /** Запись значения в кеш
   * @param key ключ
   * @param value значение
   * @param time время в секундах, через которое запись будет удалена
   */
  public setEx = (key: string, value: any, time: number) => this.getConnectedRedisClient().setEx(`${this.commonOptions.prefix}${key}`, time, JSON.stringify(value));

  /** Проверка на наличие значения в кеше
   * @param key ключ
   */
  public exists = (key: string) => this.getConnectedRedisClient().exists(`${this.commonOptions.prefix}${key}`);

  /** Удаление значения из кеша
   * @param key ключ
   */
  public delete = async (key: string) => {
    this.loggerService.info(this.TAG, `Удаление значения по ключу ${key}`);
    await this.getConnectedRedisClient().del(`${this.commonOptions.prefix}${key}`);
  };

  /**
   * Увеличивает счётчик по ключу; при первом обращении задаёт TTL окна
   * @param key - логический ключ без префикса приложения
   * @param windowSeconds - длительность окна в секундах
   * @returns новое значение счётчика после инкремента
   */
  public incrementWithWindowTtl = async (key: string, windowSeconds: number): Promise<number> => {
    const connectedRedisClient = this.getConnectedRedisClient();
    const fullKey = `${this.commonOptions.prefix}${key}`;
    const nextValueRaw = await connectedRedisClient.incr(fullKey);
    const nextValue = Number(nextValueRaw);

    if (nextValue === 1) {
      await connectedRedisClient.expire(fullKey, windowSeconds);
    }

    return nextValue;
  };

  /** Сохранение списка значений
   * @param key Ключ {@link RedisKeyEnum}
   * @param items Список сохраняемых значений
   * 
   * @returns `true` по завершении операции
   */
  public setItems = async <T extends { id: string | number }>(key: RedisKeyEnum, items: T[]) => {
    if (!items.length) {
      return true;
    }

    this.loggerService.info(this.TAG, `Обновление значений по ключам: ${items.map(({ id }) => id).join(', ').trim()}`);
    const pipeline = this.getConnectedRedisClient().multi();

    for (const item of items) {
      if (item.id) {
        pipeline.set(`${this.commonOptions.prefix}${key}${item.id}`, JSON.stringify(item));
      }
    }

    await pipeline.exec();

    return true;
  };

  /** Получение значения по `id`
   * 
   * @param key Ключ {@link RedisKeyEnum}
   * @param id Уникальный `id` значения
   * 
   * @returns Значение {@link T}
   */
  public getItemById = async <T>(key: RedisKeyEnum, id: string | number) => this.get<T>(`${key}${id}`);

  /** Обновление значения по `id`
   * 
   * @param key Ключ {@link RedisKeyEnum}
   * @param item Сохраняемое значение
   * 
   * @returns `true` по завершении операции
   */
  public updateItemById = async <T extends { id: string | number }>(key: RedisKeyEnum, item: T) => this.set(`${key}${item.id}`, item);

  /** Удаление значения по `id`
   * 
   * @param key Ключ {@link RedisKeyEnum}
   * @param item Удаляемое значение
   * 
   * @returns `true` по завершении операции
   */
  public deleteItemById = async <T extends { id: string | number }>(key: RedisKeyEnum, item: T) => this.delete(`${key}${item.id}`);

  /** Получение массива значений по их `id`
   * 
   * @param key Ключ {@link RedisKeyEnum}
   * @param ids Список `id`
   * 
   * @returns Список {@link T[]}
   */
  public getItemsByIds = async <T>(key: RedisKeyEnum, ids: (string | number)[]) => {
    const items: T[] = [];

    if (!ids.length) {
      return items;
    }

    const keys = ids.map((id) => `${this.commonOptions.prefix}${key}${id}`);

    try {
      const values = await this.getConnectedRedisClient().mGet(keys);
      for (const value of values) {
        if (value && typeof value === 'string') {
          items.push(JSON.parse(value) as T);
        }
      }
    } catch (error) {
      console.error('Redis mGet error:', error);
    }

    return items;
  };
}
