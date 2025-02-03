import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import type { InitialState } from '@/types/InitialState';
import type { OrderEntity } from '@server/db/entities/order.entity';
import type { OmitBase } from '@/types/OmitBase';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

export type OrderInterface = OmitBase<OrderEntity> & InitialState;

export interface FetchOrdersInterface extends PaginationQueryInterface {
  withDeleted?: boolean;
  statuses?: OrderStatusEnum[];
}

