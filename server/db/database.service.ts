import 'reflect-metadata';

import {
  DataSource,
  getMetadataArgsStorage,
  type EntityMetadata,
  type EntityTarget,
} from 'typeorm';
import { Singleton } from 'typescript-ioc';

import { entities } from '@server/db/entities';
import { getServerInfrastructureService } from '@server/runtime/server-infrastructure.service';

const serverInfrastructureService = getServerInfrastructureService();

export const redisConfig = serverInfrastructureService.getRedisConfig();

export const databaseConfig = serverInfrastructureService.getSharedDataSource();

type ActiveRecordEntityConstructor = EntityTarget<unknown> & {
  name: string;
  useDataSource: (dataSource: DataSource) => void;
};

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

  /**
   * Находит метаданные сущности в общем DataSource для класса из текущего бандла
   * @param entity - конструктор сущности Active Record
   * @returns метаданные TypeORM или undefined, если совпадение не найдено
   */
  private findSharedEntityMetadata = (entity: EntityTarget<unknown>): EntityMetadata | undefined => {
    if (this.db.hasMetadata(entity)) {
      return this.db.getMetadata(entity);
    }

    const tableArgs = getMetadataArgsStorage().tables.find(({ target }) => target === entity);
    const tableName = tableArgs?.name;
    const entityClassName = (entity as ActiveRecordEntityConstructor).name;

    return this.db.entityMetadatas.find((metadata) => {
      if (tableName && metadata.tableName === tableName) {
        return true;
      }

      return metadata.name === entityClassName;
    });
  };

  /**
   * Регистрирует метаданные сущности текущего бандла в entityMetadatasMap общего DataSource
   * @param entity - конструктор сущности Active Record
   * @returns void
   */
  private registerSharedEntityMetadata = (entity: EntityTarget<unknown>): void => {
    if (this.db.hasMetadata(entity)) {
      return;
    }

    const sharedMetadata = this.findSharedEntityMetadata(entity);

    if (!sharedMetadata) {
      return;
    }

    const entityMetadatasMap = this.db.entityMetadatasMap as Map<EntityTarget<unknown>, EntityMetadata>;
    entityMetadatasMap.set(entity, sharedMetadata);
  };

  /**
   * Привязывает Active Record-сущности текущего модульного контекста к общему DataSource
   * @returns void
   */
  public bindActiveRecordEntities = (): void => {
    if (!this.db.isInitialized) {
      return;
    }

    for (const entity of entities) {
      this.registerSharedEntityMetadata(entity);
      (entity as ActiveRecordEntityConstructor).useDataSource(this.db);
    }
  };

  /**
   * Инициализирует подключение к PostgreSQL (идемпотентно на общем DataSource)
   * @returns Promise по завершении подключения
   */
  public init = async (): Promise<void> => {
    try {
      if (!this.db.isInitialized) {
        await this.db.initialize();
        console.log('Соединение с PostgreSQL было успешно установлено');
      }

      this.bindActiveRecordEntities();
    } catch (error) {
      console.log('Невозможно выполнить подключение к PostgreSQL: ', error);
    }
  };
}
