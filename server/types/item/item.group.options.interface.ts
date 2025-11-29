import type { EntityManager } from 'typeorm';

export interface ItemGroupOptionsInterface {
  /** TypeORM Entity Manager */
  manager?: EntityManager;
  /** Только `id` товаров */
  onlyIds?: boolean;
  /** Без использования кэша */
  withoutCache?: boolean;
}
