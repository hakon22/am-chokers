import { expect } from 'vitest';

import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import {
  getOrderPrice,
  getOrderDiscount,
  getOrderUnitAmounts,
  getPositionAmount,
} from '@/utilities/order/getOrderPrice';
import { getAcquiringReceiptTotal } from '@/utilities/order/buildAcquiringReceiptItems';
import type { OrderInterface } from '@/types/order/Order';
import type { OrderPositionInterface } from '@/types/order/OrderPosition';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';

/** Порог бесплатной доставки в корзине (src/pages/cart.tsx) */
export const PRICE_FOR_FREE_DELIVERY_RUB = 10000;

type MakePositionParams = {
  id: number;
  itemId: number;
  price: number;
  count?: number;
  discountPrice?: number;
  name?: string;
};

type PromotionalItemStub = {
  id: number;
};

type MakePromotionalParams = Partial<Pick<
  PromotionalInterface,
  'discount' | 'discountPercent' | 'freeDelivery' | 'buyTwoGetOne' | 'name'
>> & {
  items?: PromotionalItemStub[];
};

type MakeOrderParams = {
  positions: OrderPositionInterface[];
  deliveryPrice?: number;
  promotional?: PromotionalInterface;
};

/**
 * Создаёт тестовую позицию заказа.
 * @param params - параметры позиции
 * @returns позиция заказа
 */
export const makePosition = ({
  id,
  itemId,
  price,
  count = 1,
  discountPrice = 0,
  name = 'Товар',
}: MakePositionParams): OrderPositionInterface => ({
  id,
  price,
  discountPrice,
  discount: 0,
  count,
  item: {
    id: itemId,
    translations: [
      { lang: UserLangEnum.RU, name },
      { lang: UserLangEnum.EN, name },
    ],
  },
} as OrderPositionInterface);

/**
 * Создаёт тестовый промокод.
 * @param params - поля промокода
 * @returns промокод
 */
export const makePromotional = (params: MakePromotionalParams = {}): PromotionalInterface => ({
  id: 1,
  name: params.name ?? 'TEST',
  description: 'Test promo',
  discount: params.discount ?? null,
  discountPercent: params.discountPercent ?? null,
  freeDelivery: params.freeDelivery ?? false,
  buyTwoGetOne: params.buyTwoGetOne ?? false,
  items: (params.items ?? []) as PromotionalInterface['items'],
} as PromotionalInterface);

/**
 * Создаёт тестовый заказ для расчёта цены.
 * @param params - позиции, доставка и промокод
 * @returns заказ
 */
export const makeOrder = ({
  positions,
  deliveryPrice = 0,
  promotional,
}: MakeOrderParams): Omit<OrderInterface, 'error' | 'loadingStatus'> => ({
  positions,
  deliveryPrice,
  promotional,
} as Omit<OrderInterface, 'error' | 'loadingStatus'>);

/**
 * Создаёт заказ с самовывозом (доставка = 0).
 * @param params - позиции и промокод
 * @returns заказ без доставки
 */
export const makePickupOrder = (
  params: Omit<MakeOrderParams, 'deliveryPrice'>,
): Omit<OrderInterface, 'error' | 'loadingStatus'> => makeOrder({ ...params, deliveryPrice: 0 });

/**
 * Создаёт заказ с бесплатной доставкой по порогу суммы.
 * @param positions - позиции заказа
 * @param promotional - промокод
 * @returns заказ с обнулённой доставкой
 */
export const makeOrderWithFreeDeliveryByThreshold = (
  positions: OrderPositionInterface[],
  promotional?: PromotionalInterface,
): Omit<OrderInterface, 'error' | 'loadingStatus'> => makeOrder({ positions, deliveryPrice: 0, promotional });

/**
 * Проверяет, что сумма unit-amounts по позиции совпадает с line amount.
 * @param order - заказ
 */
export const assertUnitAmountsMatchLineAmount = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>): void => {
  const unitAmounts = getOrderUnitAmounts(order);
  const positionAmounts = getPositionAmount(order);

  Object.entries(positionAmounts).forEach(([positionId, lineAmount]) => {
    const positionIndex = order.positions.findIndex((position) => String(position.id) === String(positionId));
    const positionUnitAmounts = unitAmounts
      .filter((unitAmount) => unitAmount.positionIndex === positionIndex)
      .map((unitAmount) => unitAmount.amount);
    const unitSum = +positionUnitAmounts.reduce((acc, amount) => acc + amount, 0).toFixed(2);

    expect(unitSum).toBe(lineAmount);
  });
};

export {
  getOrderPrice,
  getOrderDiscount,
  getAcquiringReceiptTotal,
};
