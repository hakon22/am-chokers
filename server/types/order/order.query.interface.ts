import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

export interface OrderQueryInterface extends Partial<PaginationQueryInterface> {
  /** `id` заказа */
  id?: number;
  /** Статусы заказов */
  statuses?: OrderStatusEnum[];
}
