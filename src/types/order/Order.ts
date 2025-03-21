import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import type { InitialState } from '@/types/InitialState';
import type { OrderEntity } from '@server/db/entities/order.entity';
import type { OmitBase } from '@/types/OmitBase';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';

export type OrderInterface = OmitBase<OrderEntity> & InitialState;

export interface FetchOrdersInterface extends PaginationQueryInterface {
  withDeleted?: boolean;
  statuses?: OrderStatusEnum[];
}

export interface CreateDeliveryInterface {
  price: number;
  locality: string;
  street: string;
  house: string;
  address: string;
  platformStationFrom: string;
  platformStationTo: string;
  type?: DeliveryTypeEnum;
}

export interface CreateOrderInterface {
  cart: CartItemInterface[];
  promotional?: PromotionalInterface;
  delivery: CreateDeliveryInterface;
}

