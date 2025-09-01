import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

export const getOrderStatusColor = (status: OrderStatusEnum) => {
  const badgeColors: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.NOT_PAID]: '#cea1aaff',
    [OrderStatusEnum.NEW]: '#396fbfff',
    [OrderStatusEnum.ASSEMBLY]: '#738db3ff',
    [OrderStatusEnum.ASSEMBLED]: '#a1cacdff',
    [OrderStatusEnum.CANCELED]: '#c57081ff',
    [OrderStatusEnum.DELIVERING]: '#a1cdc1ff',
    [OrderStatusEnum.DELIVERED]: '#a1cdafff',
    [OrderStatusEnum.COMPLETED]: '#70ad6eff',
  };

  return badgeColors[status];
};
