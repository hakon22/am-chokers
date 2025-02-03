import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

export const getOrderStatusColor = (status: OrderStatusEnum) => {
  const badgeColors: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.NEW]: 'blue',
    [OrderStatusEnum.ASSEMBLY]: 'gold',
    [OrderStatusEnum.ASSEMBLED]: 'purple',
    [OrderStatusEnum.CANCELED]: 'volcano',
    [OrderStatusEnum.DELIVERING]: 'yellow',
    [OrderStatusEnum.DELIVERED]: 'orange',
    [OrderStatusEnum.COMPLETED]: 'green',
  };

  return badgeColors[status];
};
