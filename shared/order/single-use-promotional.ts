import { DEFAULT_SHIPPING_RATE_RUB, PRICE_FOR_FREE_DELIVERY_RUB } from '@shared/delivery-config';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';

/** Минимальные поля промокода для логики одноразового использования */
export type SingleUsePromotionalStub = {
  id?: number;
  singleUse?: boolean;
  freeDelivery?: boolean;
};

/** Заказ для проверки lifecycle одноразового промокода */
export type SingleUseOrderLifecycleStub = {
  id: number;
  userId: number;
  promotionalId?: number | null;
  status: OrderStatusEnum;
  isPayment: boolean;
};

/** Оплаченный заказ для инвалидации других неоплаченных */
export type SingleUsePaidOrderStub = {
  id: number;
  userId: number;
  promotional?: SingleUsePromotionalStub | null;
};

/** Код ответа API: промокод уже использован пользователем */
export const PROMOTIONAL_RESPONSE_ALREADY_USED = 6;

/**
 * Проверяет, положена ли бесплатная доставка по порогу суммы товаров
 * @param goodsTotalRub - сумма товаров в рублях
 * @returns true, если доставка до ПВЗ бесплатна по порогу
 */
export const isOrderEligibleForFreeDeliveryByThreshold = (goodsTotalRub: number): boolean => goodsTotalRub >= PRICE_FOR_FREE_DELIVERY_RUB;

/**
 * Восстанавливает стоимость доставки после снятия промокода с бесплатной доставкой
 * @param deliveryPrice - текущая стоимость доставки в заказе
 * @param deliveryType - тип доставки
 * @param strippedPromotional - снятый промокод
 * @param quotedDeliveryPrice - котировка из виджета до обнуления
 * @param goodsTotalRub - сумма товаров без доставки
 * @returns восстановленная стоимость доставки
 */
export const restoreDeliveryPriceWithoutPromotional = (
  deliveryPrice: number,
  deliveryType: DeliveryTypeEnum,
  strippedPromotional: SingleUsePromotionalStub,
  quotedDeliveryPrice?: number | null,
  goodsTotalRub = 0,
): number => {
  if (!strippedPromotional.freeDelivery) {
    return deliveryPrice;
  }

  if (deliveryPrice > 0) {
    return deliveryPrice;
  }

  if (deliveryType === DeliveryTypeEnum.PICKUP) {
    return 0;
  }

  if (isOrderEligibleForFreeDeliveryByThreshold(goodsTotalRub)) {
    return 0;
  }

  if (quotedDeliveryPrice && quotedDeliveryPrice > 0) {
    return quotedDeliveryPrice;
  }

  return DEFAULT_SHIPPING_RATE_RUB;
};

/**
 * Проверяет, использовал ли пользователь одноразовый промокод в оплаченном заказе
 * @param orders - список заказов пользователя (in-memory или из БД)
 * @param userId - идентификатор пользователя
 * @param promotionalId - идентификатор промокода
 * @param excludeOrderId - заказ, исключаемый из проверки (повторная оплата)
 * @returns true, если есть другой оплаченный заказ с этим промокодом
 */
export const isSingleUsePromotionalConsumedForUser = (
  orders: SingleUseOrderLifecycleStub[],
  userId: number,
  promotionalId: number,
  excludeOrderId?: number,
): boolean => orders.some((order) => {
  if (order.userId !== userId) {
    return false;
  }

  if (order.promotionalId !== promotionalId) {
    return false;
  }

  if (!order.isPayment) {
    return false;
  }

  if (excludeOrderId !== undefined && order.id === excludeOrderId) {
    return false;
  }

  return true;
});

/**
 * Возвращает неоплаченные заказы пользователя для снятия одноразового промокода
 * @param orders - все заказы для фильтрации
 * @param paidOrder - только что оплаченный заказ
 * @returns заказы, у которых нужно снять промокод
 */
export const getUnpaidOrdersToInvalidateSingleUsePromo = (
  orders: SingleUseOrderLifecycleStub[],
  paidOrder: SingleUsePaidOrderStub,
): SingleUseOrderLifecycleStub[] => {
  const { promotional } = paidOrder;

  if (!promotional?.singleUse || !promotional.id) {
    return [];
  }

  return orders.filter((order) => {
    if (order.id === paidOrder.id) {
      return false;
    }

    if (order.userId !== paidOrder.userId) {
      return false;
    }

    if (order.promotionalId !== promotional.id) {
      return false;
    }

    if (order.status !== OrderStatusEnum.NOT_PAID) {
      return false;
    }

    return true;
  });
};
