import type { EntityManager } from 'typeorm';

export interface ItemOptionsInterface {
  /** Только `id` товаров */
  onlyIds?: boolean;
  /** `ids` товаров */
  ids?: number[];
  /** С оценками */
  withGrades?: boolean;
  /** TypeORM Entity Manager */
  manager?: EntityManager;
  /** Полная сущность со всеми оставшимися связями */
  fullItem?: boolean;
  /** Без использования кэша */
  withoutCache?: boolean;
}
