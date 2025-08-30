import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export const getOrderStatusTranslate = (status: OrderStatusEnum, lang: UserLangEnum) => {
  const orderStatusTranslateRu: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.NOT_PAID]: 'НЕ ОПЛАЧЕН',
    [OrderStatusEnum.NEW]: 'НОВЫЙ',
    [OrderStatusEnum.ASSEMBLY]: 'СБОРКА',
    [OrderStatusEnum.ASSEMBLED]: 'СОБРАН',
    [OrderStatusEnum.DELIVERING]: 'ДОСТАВЛЯЕТСЯ',
    [OrderStatusEnum.DELIVERED]: 'ДОСТАВЛЕНО',
    [OrderStatusEnum.COMPLETED]: 'ИСПОЛНЕН',
    [OrderStatusEnum.CANCELED]: 'ОТМЕНЁН',
  };

  const orderStatusTranslateEn: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.NOT_PAID]: 'NOT PAID',
    [OrderStatusEnum.NEW]: 'NEW',
    [OrderStatusEnum.ASSEMBLY]: 'ASSEMBLY',
    [OrderStatusEnum.ASSEMBLED]: 'ASSEMBLED',
    [OrderStatusEnum.DELIVERING]: 'DELIVERING',
    [OrderStatusEnum.DELIVERED]: 'DELIVERED',
    [OrderStatusEnum.COMPLETED]: 'COMPLETED',
    [OrderStatusEnum.CANCELED]: 'CANCELED',
  };

  const translates: Record<UserLangEnum, Record<OrderStatusEnum, string>> = {
    [UserLangEnum.RU]: orderStatusTranslateRu,
    [UserLangEnum.EN]: orderStatusTranslateEn,
  };

  return translates[lang][status];
};
