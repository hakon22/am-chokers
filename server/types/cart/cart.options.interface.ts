import type { EntityManager } from 'typeorm';

export interface CartOptionsInterface {
  /** Без `джойнов` */
  withoutJoin?: boolean;
  /** Менеджер typeorm */
  manager?: EntityManager;
}
