import { createClient, RedisClientType } from 'redis';
import { Container, Singleton } from 'typescript-ioc';

import { redisConfig } from '@server/db/database.service';
import { LoggerService } from '@server/services/app/logger.service';
import { RedisKeyEnum } from '@server/types/db/enums/redis-key.enum';

@Singleton
export class RedisService {
  private redis: RedisClientType<any, any, any, any, any>;

  public subscribeRedis: RedisClientType<any, any, any, any, any>;

  private readonly loggerService = Container.get(LoggerService);

  private readonly TAG = 'RedisService';

  public commonOptions = {
    socket: redisConfig,
    prefix: `${process.env.NEXT_PUBLIC_APP_NAME ?? 'myapp'}:${process.env.NODE_ENV ?? 'development'}:`.toUpperCase(),
  };

  public init = async (options?: { withoutSubscribles?: boolean; }) => {
    this.redis = await createClient(this.commonOptions)
      .on('error', (error) => console.log('Невозможно подключиться к Redis', error))
      .connect();

    if (!options?.withoutSubscribles) {
      this.subscribeRedis = await createClient(this.commonOptions)
        .on('error', (error) => console.log('Ошибка при попытке подписаться на события Redis', error))
        .connect();
    }

    console.log('Соединение с Redis было успешно установлено');
  };

  /** Получение значения из кеша
   * @param key ключ
   */
  public get = async <T>(key: string): Promise<T | null> => {
    this.loggerService.info(this.TAG, `Получение значения по ключу ${key}`);
    const value = await this.redis.get(`${this.commonOptions.prefix}${key}`);

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
    await this.redis.set(`${this.commonOptions.prefix}${key}`, newValue);
  };

  /** Запись значения в кеш
   * @param key ключ
   * @param value значение
   * @param time время в секундах, через которое запись будет удалена
   */
  public setEx = (key: string, value: any, time: number) => this.redis.setEx(`${this.commonOptions.prefix}${key}`, time, JSON.stringify(value));

  /** Проверка на наличие значения в кеше
   * @param key ключ
   */
  public exists = (key: string) => this.redis.exists(`${this.commonOptions.prefix}${key}`);

  /** Удаление значения из кеша
   * @param key ключ
   */
  public delete = async (key: string) => {
    this.loggerService.info(this.TAG, `Удаление значения по ключу ${key}`);
    await this.redis.del(`${this.commonOptions.prefix}${key}`);
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
    const pipeline = this.redis.multi();

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
      const values = await this.redis.mGet(keys);
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
