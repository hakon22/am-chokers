import type { EntityManager } from 'typeorm';

export interface BannerOptionsInterface {
  /** TypeORM Entity Manager */
  manager?: EntityManager;
}
