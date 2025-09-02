import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

export interface UserOptionsInterface extends Partial<PaginationQueryInterface> {
  /** Вместе с паролем */
  withPassword?: boolean;
  /** С удалёнными */
  withDeleted?: boolean;
  /** С заказами */
  withOrders?: boolean;
  /** Вместе с токенами */
  withTokens?: boolean;
}
