import type { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';

export interface SalesRevenueByDeliveryTypeInterface {
  /** Тип доставки */
  type: DeliveryTypeEnum;
  /** Число оплаченных заказов с этим типом доставки */
  ordersCount: number;
  /** Выручка по оплаченным заказам, руб. */
  revenue: number;
}
