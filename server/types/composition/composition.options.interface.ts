import type { EntityManager } from 'typeorm';

export interface CompositionOptionsInterface {
  /** TypeORM Entity Manager */
  manager?: EntityManager;
}
