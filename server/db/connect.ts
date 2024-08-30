import 'reflect-metadata';
import { DataSource } from 'typeorm';

const {
  DB = 'LOCAL',
  DB_LOCAL = '',
  DB_HOST = '',
  USER_DB_LOCAL = '',
  PASSWORD_DB_LOCAL = '',
  USER_DB_HOST = '',
  PASSWORD_DB_HOST = '',
} = process.env;

export const db = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: DB === 'LOCAL' ? USER_DB_LOCAL : USER_DB_HOST,
  password: DB === 'LOCAL' ? PASSWORD_DB_LOCAL : PASSWORD_DB_HOST,
  database: DB === 'LOCAL' ? DB_LOCAL : DB_HOST,
  schema: 'chokers',
  synchronize: true,
  logging: true,
  entities: [],
  subscribers: [],
  migrations: [],
});

export const connectToDb = async () => {
  try {
    await db.initialize();
    console.log('Соединение с БД было успешно установлено');
  } catch (e) {
    console.log('Невозможно выполнить подключение к БД: ', e);
  }
};
