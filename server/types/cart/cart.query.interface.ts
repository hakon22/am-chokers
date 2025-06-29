import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

export interface CartQueryInterface extends Partial<PaginationQueryInterface> {
  /** `id` товара корзины */
  id?: string;
  /** Список `id` товара корзины */
  ids?: string[];
}
