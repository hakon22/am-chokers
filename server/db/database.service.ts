import { DataSource } from 'typeorm';
import { Singleton } from 'typescript-ioc';

import { entities } from '@server/db/entities';
import { TypeormLogger } from '@server/db/typeorm.logger';
import 'dotenv/config';

const {
  DB = 'LOCAL',
  DB_LOCAL = '',
  DB_HOST = '',
  USER_DB_LOCAL = '',
  PASSWORD_DB_LOCAL = '',
  USER_DB_HOST = '',
  PASSWORD_DB_HOST = '',
  NODE_ENV,
} = process.env;

const host = NODE_ENV === 'production' ? 'localhost' : 'host.docker.internal';

export const redisConfig = {
  host,
  port: 6379,
};

export const databaseConfig = new DataSource({
  type: 'postgres',
  host,
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
  migrations: ['server/db/migrations/*.ts'],
});

@Singleton
export abstract class DatabaseService {
  private db: DataSource;

  constructor() {
    this.db = databaseConfig;
  }

  public getManager = () => {
    if (!this.db.isInitialized) {
      throw new Error('Database connection is not initialized. Please call init() first.');
    }
    return this.db.createEntityManager();
  };

  public init = async () => {
    try {
      await this.db.initialize();
      console.log('Соединение с PostgreSQL было успешно установлено');
    } catch (e) {
      console.log('Невозможно выполнить подключение к PostgreSQL: ', e);
    }
  };
}
