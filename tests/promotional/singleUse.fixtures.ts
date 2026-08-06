import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { restoreDeliveryPriceWithoutPromotional } from '@shared/order/single-use-promotional';
import type { OrderInterface } from '@/types/order/Order';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';

import { makeOrder, makePosition, makePromotional } from '@tests/order/getOrderPrice.fixtures';

type MakeSingleUsePersonalPromoParams = Partial<Pick<
  PromotionalInterface,
  'discount' | 'discountPercent' | 'freeDelivery' | 'buyTwoGetOne' | 'name'
>> & {
  userId?: number;
  items?: { id: number; }[];
};

type MakeOrderAfterSingleUseStrippedParams = {
  deliveryPrice?: number;
  deliveryType?: DeliveryTypeEnum;
};

/**
 * Создаёт персональный одноразовый промокод с пользователем в whitelist
 * @param params - параметры промокода
 * @returns промокод singleUse
 */
export const makeSingleUsePersonalPromo = ({
  userId = 42,
  ...params
}: MakeSingleUsePersonalPromoParams = {}): PromotionalInterface => makePromotional({
  ...params,
  singleUse: true,
  users: [{ id: userId }],
});

/**
 * Имитирует заказ после снятия одноразового промокода
 * @param order - исходный заказ со скидкой
 * @param params - восстановленная доставка
 * @returns заказ без promotional
 */
export const makeOrderAfterSingleUseStripped = (
  order: Omit<OrderInterface, 'error' | 'loadingStatus'>,
  { deliveryPrice, deliveryType }: MakeOrderAfterSingleUseStrippedParams = {},
): Omit<OrderInterface, 'error' | 'loadingStatus'> => {
  const promotional = order.promotional;
  const restoredDeliveryPrice = deliveryPrice ?? (
    promotional?.freeDelivery
      ? restoreDeliveryPriceWithoutPromotional(
        order.deliveryPrice,
        deliveryType ?? order.delivery?.type ?? DeliveryTypeEnum.YANDEX_DELIVERY,
        promotional,
        order.quotedDeliveryPrice,
        order.positions.reduce(
          (acc, position) => acc + ((position.price - position.discountPrice) * position.count),
          0,
        ),
      )
      : order.deliveryPrice
  );

  return {
    ...order,
    promotional: undefined,
    deliveryPrice: restoredDeliveryPrice,
    delivery: {
      ...order.delivery,
      type: deliveryType ?? order.delivery?.type ?? DeliveryTypeEnum.YANDEX_DELIVERY,
    },
  } as Omit<OrderInterface, 'error' | 'loadingStatus'>;
};

export {
  makeOrder,
  makePosition,
  makePromotional,
};
