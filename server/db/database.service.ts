import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Singleton } from 'typescript-ioc';

import { entities } from '@server/db/entities';

const {
  DB = 'LOCAL',
  DB_LOCAL = '',
  DB_HOST = '',
  USER_DB_LOCAL = '',
  PASSWORD_DB_LOCAL = '',
  USER_DB_HOST = '',
  PASSWORD_DB_HOST = '',
} = process.env;

@Singleton
export class DatabaseService {
  private readonly db: DataSource;

  constructor() {
    this.db = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: DB === 'LOCAL' ? USER_DB_LOCAL : USER_DB_HOST,
      password: DB === 'LOCAL' ? PASSWORD_DB_LOCAL : PASSWORD_DB_HOST,
      database: DB === 'LOCAL' ? DB_LOCAL : DB_HOST,
      schema: 'chokers',
      synchronize: true,
      logging: true,
      entities,
      subscribers: [],
      migrations: [],
    });
  }

  public getManager = () => {
    const runner = this.db.createQueryRunner();
    const manager = this.db.createEntityManager(runner);
    return manager;
  };

  public init = async () => {
    try {
      await this.db.initialize();
      console.log('Соединение с БД было успешно установлено');
    } catch (e) {
      console.log('Невозможно выполнить подключение к БД: ', e);
    }
  };
}
