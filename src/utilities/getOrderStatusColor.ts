import type { OrderInterface } from '@/types/order/Order';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

export const getOrderStatusColor = (order: OrderInterface) => {
  const badgeColors: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.NEW]: 'blue',
    [OrderStatusEnum.ASSEMBLY]: 'gold',
    [OrderStatusEnum.CANCELED]: 'volcano',
    [OrderStatusEnum.DELIVERING]: 'yellow',
    [OrderStatusEnum.DELIVERED]: 'orange',
    [OrderStatusEnum.COMPLETED]: 'green',
  };

  return badgeColors[order.status];
};
