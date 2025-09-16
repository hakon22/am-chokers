import type { EntityManager } from 'typeorm';

export interface DeferredPublicationOptionsInterface {
  /** `id` отложенной публикации */
  id?: number;
  /** С удалёнными */
  withDeleted?: boolean;
  /** TypeORM Entity Manager */
  manager?: EntityManager;
}
