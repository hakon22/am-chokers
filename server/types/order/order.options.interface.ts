import type { EntityManager } from 'typeorm';

export interface OrderOptionsInterface {
  /** Только `id` заказов */
  onlyIds?: boolean;
  /** `ids` заказов */
  ids?: number[];
  /** `id` покупателя */
  userId?: number;
  /** Вместе с пользователем */
  withUser?: boolean;
  /** С удалёнными */
  withDeleted?: boolean;
  /** Менеджер typeorm */
  manager?: EntityManager;
}
