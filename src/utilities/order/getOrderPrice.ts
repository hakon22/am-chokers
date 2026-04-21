import _ from 'lodash';

import type { OrderInterface } from '@/types/order/Order';
import type { OrderPositionInterface } from '@/types/order/OrderPosition';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';

const BUY_TWO_GET_ONE_GIFT_UNIT_PRICE_RUB = 1;

type BuyTwoGetOneUnit = {
  lineKey: string;
  unitPrice: number;
  tieBreaker: number;
};

export type BuyTwoGetOneBreakdown = {
  paidByLineKey: Record<string, number>;
  eligibleFullTotal: number;
  eligiblePaidTotal: number;
};

const getPositionLineKey = (position: OrderPositionInterface, positionIndex: number) => String(
  !_.isNil(position.id) ? position.id : `idx-${positionIndex}`,
);

/**
 * Список `items` задаёт, какие товары могут получить льготную цену по 2+1.
 * Число «подарков» K = floor(N/3), где N — сумма `count` по товарным позициям (фиктивная доставка для чека НПД: `id` позиции = 0 и нет `item.id` — не считается); скидочная цена назначается к самым дешёвым единицам среди товаров из списка.
 */
const getBuyTwoGetOneRestrictedItemIds = (promotional: PromotionalInterface): Set<number> | undefined => {
  if (!promotional.items?.length) {
    return undefined;
  }
  return new Set(promotional.items.map((promotionalItem) => Number(promotionalItem.id)));
};

/**
 * Определяет, участвует ли позиция в пуле 2+1. Не участвуют фиктивные строки доставки для чека (`id` позиции 0, без `item.id`, см. acquiring) и любые позиции без привязки к товару.
 * @param position - позиция заказа
 * @param restrictedItemIds - множество id товаров из промокода или undefined, если ограничения нет
 * @returns true, если позиция может получить льготную цену по акции
 */
const isPositionInBuyTwoGetOneDiscountPool = (position: OrderPositionInterface, restrictedItemIds: Set<number> | undefined) => {
  if (position.id === 0 || _.isNil(position.item?.id)) {
    return false;
  }
  if (!restrictedItemIds) {
    return true;
  }
  return restrictedItemIds.has(Number(position.item.id));
};

export const computeBuyTwoGetOneBreakdown = (positions: OrderInterface['positions'], promotional: PromotionalInterface): BuyTwoGetOneBreakdown => {
  const restrictedItemIds = getBuyTwoGetOneRestrictedItemIds(promotional);
  const totalCartUnitCount = positions.reduce((accumulator, position) => {
    if (position.id === 0 || _.isNil(position.item?.id)) {
      return accumulator;
    }
    return accumulator + position.count;
  }, 0);
  const giftSlotsFromWholeCart = Math.floor(totalCartUnitCount / 3);

  let tieBreaker = 0;
  const discountableUnits: BuyTwoGetOneUnit[] = [];

  positions.forEach((position, positionIndex) => {
    if (!isPositionInBuyTwoGetOneDiscountPool(position, restrictedItemIds)) {
      return;
    }
    const lineKey = getPositionLineKey(position, positionIndex);
    const unitPrice = +(((position.price * 100) - (position.discountPrice * 100)) / 100).toFixed(2);
    for (let unitIndex = 0; unitIndex < position.count; unitIndex++) {
      discountableUnits.push({ lineKey, unitPrice, tieBreaker: tieBreaker++ });
    }
  });

  const eligibleFullTotal = +discountableUnits.reduce((accumulator, unit) => accumulator + unit.unitPrice, 0).toFixed(2);
  const giftUnitCount = Math.min(giftSlotsFromWholeCart, discountableUnits.length);
  const sortedUnits = [...discountableUnits].sort((unitA, unitB) => {
    if (unitA.unitPrice !== unitB.unitPrice) {
      return unitA.unitPrice - unitB.unitPrice;
    }
    if (unitA.lineKey !== unitB.lineKey) {
      return unitA.lineKey.localeCompare(unitB.lineKey);
    }
    return unitA.tieBreaker - unitB.tieBreaker;
  });

  const paidByLineKey: Record<string, number> = {};
  const giftUnitCharge = (unitPrice: number) => Math.min(BUY_TWO_GET_ONE_GIFT_UNIT_PRICE_RUB, unitPrice);

  sortedUnits.forEach((unit, sortedIndex) => {
    const unitPaid = sortedIndex < giftUnitCount ? giftUnitCharge(unit.unitPrice) : unit.unitPrice;
    paidByLineKey[unit.lineKey] = (paidByLineKey[unit.lineKey] || 0) + unitPaid;
  });

  const eligiblePaidTotal = +Object.values(paidByLineKey).reduce((accumulator, value) => accumulator + value, 0).toFixed(2);

  return { paidByLineKey, eligibleFullTotal, eligiblePaidTotal };
};

export const getPositionsPrice = (positions: OrderInterface['positions'], deliveryPrice = 0, withoutDiscount = false) => +(positions.reduce((acc, position) => acc + ((position.price * 100) - (withoutDiscount ? 0 : position.discountPrice * 100)) * position.count, deliveryPrice * 100) / 100).toFixed(2);

export const getPositionPrice = (position: OrderPositionInterface) => +(((position.price * 100) - (position.discountPrice * 100)) * position.count / 100).toFixed(2);

export const getDiscountPercent = (positions: OrderInterface['positions'], deliveryPrice: number, promotional?: PromotionalInterface) => {
  if (promotional?.buyTwoGetOne) {
    return 0;
  }

  const price = getPositionsPrice(positions, deliveryPrice);

  const discountPercent = promotional
    ? promotional.discountPercent || (100 - ((price - promotional.discount) * 100 / price))
    : 0;

  return discountPercent;
};

export const getPositionPriceWithDiscount = (position: OrderPositionInterface, percent: number) => {
  const price = getPositionPrice(position);
  const discount = (price * percent) / 100;

  return +(price - discount).toFixed(2);
};

export const getOrderDiscount = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>) => {
  const promotional = order.promotional;
  if (promotional?.buyTwoGetOne) {
    const { eligibleFullTotal, eligiblePaidTotal } = computeBuyTwoGetOneBreakdown(order.positions, promotional);
    return +(eligibleFullTotal - eligiblePaidTotal).toFixed(2);
  }

  const percent = getDiscountPercent(order.positions, order.deliveryPrice, order.promotional);

  const totalDiscount = order.positions
    .filter(({ item }) => order.promotional?.items?.length ? order.promotional.items.map(({ id }) => id).includes(item.id) : true )
    .reduce((acc, position) => acc + (getPositionPrice(position) - (getPositionPriceWithDiscount(position, percent))), 0);

  const deliveryDiscount = ((order.deliveryPrice * 100) - ((order.deliveryPrice * 100) - ((order.deliveryPrice * 100 * percent) / 100))) / 100;

  const orderDiscount = totalDiscount + (order.promotional?.items?.length ? 0 : deliveryDiscount);

  return +orderDiscount.toFixed(2);
};

export const getOrderPrice = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>) => {
  const promotional = order.promotional;
  if (promotional?.buyTwoGetOne) {
    const restrictedItemIds = getBuyTwoGetOneRestrictedItemIds(promotional);
    const { paidByLineKey } = computeBuyTwoGetOneBreakdown(order.positions, promotional);
    const goodsTotal = order.positions.reduce((accumulator, position, positionIndex) => {
      if (isPositionInBuyTwoGetOneDiscountPool(position, restrictedItemIds)) {
        const lineKey = getPositionLineKey(position, positionIndex);
        return accumulator + (paidByLineKey[lineKey] ?? 0);
      }
      return accumulator + getPositionPrice(position);
    }, 0);
    return +(goodsTotal + order.deliveryPrice).toFixed(2);
  }

  const discount = getOrderDiscount(order);

  const totalPrice = getPositionsPrice(order.positions, order.deliveryPrice);

  return +(totalPrice - discount).toFixed(2);
};

export const getPositionAmount = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>) => {
  const promotional = order.promotional;
  if (promotional?.buyTwoGetOne) {
    const restrictedItemIds = getBuyTwoGetOneRestrictedItemIds(promotional);
    const { paidByLineKey } = computeBuyTwoGetOneBreakdown(order.positions, promotional);
    return order.positions.reduce((accumulator, position, positionIndex) => {
      const rowKey = position.id !== undefined && position.id !== null ? position.id : getPositionLineKey(position, positionIndex);
      if (isPositionInBuyTwoGetOneDiscountPool(position, restrictedItemIds)) {
        const lineKey = getPositionLineKey(position, positionIndex);
        accumulator[rowKey] = +(paidByLineKey[lineKey] ?? 0).toFixed(2);
      } else {
        accumulator[rowKey] = getPositionPrice(position);
      }
      return accumulator;
    }, {} as Record<string | number, number>);
  }

  const discountPercent = getDiscountPercent(order.positions, order.deliveryPrice, order.promotional);

  const positionsAmount = order.positions.reduce((acc, position) => {
    let positionDiscountPercent = discountPercent;
    if (order.promotional && order.promotional.items.length) {
      if (!order.promotional.items.map(({ id }) => id).includes(position.item.id)) {
        positionDiscountPercent = 0;
      }
    }
    acc[position.id] = getPositionPriceWithDiscount(position, positionDiscountPercent);
    return acc;
  }, {} as Record<number, number>);

  return positionsAmount;
};
