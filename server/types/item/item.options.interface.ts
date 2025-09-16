import type { EntityManager } from 'typeorm';

export interface ItemOptionsInterface {
  /** Только `id` товаров */
  onlyIds?: boolean;
  /** С удалёнными */
  withDeleted?: boolean;
  /** `ids` товаров */
  ids?: number[];
  /** С оценками */
  withGrades?: boolean;
  /** TypeORM Entity Manager */
  manager?: EntityManager;
  /** Полная сущность со всеми связями */
  fullItem?: boolean;
}
