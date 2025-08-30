import type { EntityManager } from 'typeorm';

export interface ItemCollectionOptionsInterface {
  /** TypeORM Entity Manager */
  manager?: EntityManager;
}
