import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

export const getOrderStatusTranslate = (status: OrderStatusEnum) => {
  const orderStatusTranslate: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.NOT_PAID]: 'НЕ ОПЛАЧЕН',
    [OrderStatusEnum.NEW]: 'НОВЫЙ',
    [OrderStatusEnum.ASSEMBLY]: 'СБОРКА',
    [OrderStatusEnum.ASSEMBLED]: 'СОБРАН',
    [OrderStatusEnum.DELIVERING]: 'ДОСТАВЛЯЕТСЯ',
    [OrderStatusEnum.DELIVERED]: 'ДОСТАВЛЕНО',
    [OrderStatusEnum.COMPLETED]: 'ИСПОЛНЕН',
    [OrderStatusEnum.CANCELED]: 'ОТМЕНЁН',
  };

  return orderStatusTranslate[status];
};
