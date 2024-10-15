import { createClient, RedisClientType } from 'redis';
import { Singleton } from 'typescript-ioc';

@Singleton
export class RedisService {
  private redis: RedisClientType<any, any, any>;

  public init = async () => {
    this.redis = await createClient()
      .on('error', (error) => console.log('Невозможно подключиться к Redis', error))
      .connect();
  };

  /** Получение значения из кеша
   * @param [key] ключ
   */
  public get = async <T>(key: string): Promise<T | null> => {
    const value = await this.redis.get(key);

    return value ? JSON.parse(value) : null;
  };

  /** Запись значения в кеш
   * @key ключ
   * @param [value] значение
   */
  public set = (key: string, value: any) => this.redis.set(key, JSON.stringify(value));

  /** Запись значения в кеш
   * @param [key] ключ
   * @param [value] значение
   * @param [time] время в секундах, через которое запись будет удалена
   */
  public setEx = (key: string, value: any, time: number) => this.redis.setEx(key, time, JSON.stringify(value));

  /** Проверка на наличие значения в кеше
   * @param [key] ключ
   */
  public exists = (key: string) => this.redis.exists(key);

  /** Удаление значения из кеша
   * @param [key] ключ
   */
  public delete = (key: string) => this.redis.del(key);
}
