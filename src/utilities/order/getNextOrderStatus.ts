import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

interface NextOrderStatusesInterface {
  next?: OrderStatusEnum;
  back?: OrderStatusEnum;
}

export const getNextOrderStatuses = (status: OrderStatusEnum) => {
  const result: NextOrderStatusesInterface = {
    next: undefined,
    back: undefined,
  };

  switch (status) {
  case OrderStatusEnum.NEW:
    result.next = OrderStatusEnum.ASSEMBLY;
    break;
  case OrderStatusEnum.ASSEMBLY:
    result.next = OrderStatusEnum.ASSEMBLED;
    result.back = OrderStatusEnum.NEW;
    break;
  case OrderStatusEnum.ASSEMBLED:
    result.next = OrderStatusEnum.DELIVERING;
    result.back = OrderStatusEnum.ASSEMBLY;
    break;
  case OrderStatusEnum.DELIVERING:
    result.next = OrderStatusEnum.DELIVERED;
    result.back = OrderStatusEnum.ASSEMBLED;
    break;
  case OrderStatusEnum.DELIVERED:
    result.next = OrderStatusEnum.COMPLETED;
    result.back = OrderStatusEnum.DELIVERING;
    break;
  }

  return result;
};
