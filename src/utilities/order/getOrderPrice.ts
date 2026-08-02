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
  unitPaidByLineKey: Record<string, number[]>;
  eligibleFullTotal: number;
  eligiblePaidTotal: number;
};

export type OrderUnitAmountInterface = {
  positionIndex: number;
  amount: number;
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

export const computeBuyTwoGetOneBreakdown = (positions: OrderPositionInterface[], promotional: PromotionalInterface): BuyTwoGetOneBreakdown => {
  const restrictedItemIds = getBuyTwoGetOneRestrictedItemIds(promotional);
  const totalCartUnitCount = positions.reduce((acc, position) => {
    if (position.id === 0 || _.isNil(position.item?.id)) {
      return acc;
    }
    return acc + position.count;
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

  const eligibleFullTotal = +discountableUnits.reduce((acc, unit) => acc + unit.unitPrice, 0).toFixed(2);
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
  const unitPaidByLineKey: Record<string, number[]> = {};
  const giftUnitCharge = (unitPrice: number) => Math.min(BUY_TWO_GET_ONE_GIFT_UNIT_PRICE_RUB, unitPrice);

  sortedUnits.forEach((unit, sortedIndex) => {
    const unitPaid = sortedIndex < giftUnitCount ? giftUnitCharge(unit.unitPrice) : unit.unitPrice;
    paidByLineKey[unit.lineKey] = (paidByLineKey[unit.lineKey] || 0) + unitPaid;
    if (!unitPaidByLineKey[unit.lineKey]) {
      unitPaidByLineKey[unit.lineKey] = [];
    }
    unitPaidByLineKey[unit.lineKey].push(+unitPaid.toFixed(2));
  });

  const eligiblePaidTotal = +Object.values(paidByLineKey).reduce((acc, value) => acc + value, 0).toFixed(2);

  return { paidByLineKey, unitPaidByLineKey, eligibleFullTotal, eligiblePaidTotal };
};

/**
 * Разбивает сумму строки на количество единиц без потери итоговой суммы.
 * @param lineAmount - сумма строки в рублях
 * @param quantity - количество единиц строки
 * @returns массив сумм по единицам в рублях
 */
const splitLineAmountToUnitAmounts = (lineAmount: number, quantity: number): number[] => {
  const lineAmountInCents = Math.round(lineAmount * 100);
  const baseUnitAmountInCents = Math.floor(lineAmountInCents / quantity);
  const remainderInCents = lineAmountInCents - (baseUnitAmountInCents * quantity);

  return Array.from({ length: quantity }, (_, unitIndex) => {
    const unitAmountInCents = baseUnitAmountInCents + (unitIndex < remainderInCents ? 1 : 0);
    return +(unitAmountInCents / 100).toFixed(2);
  });
};

export const getPositionsPrice = (positions: OrderPositionInterface[], deliveryPrice = 0, withoutDiscount = false) => +(positions.reduce((acc, position) => acc + ((position.price * 100) - (withoutDiscount ? 0 : position.discountPrice * 100)) * position.count, deliveryPrice * 100) / 100).toFixed(2);

export const getPositionPrice = (position: OrderPositionInterface) => +(((position.price * 100) - (position.discountPrice * 100)) * position.count / 100).toFixed(2);

/**
 * Проверяет, подходит ли позиция под промокод с ограничением по товарам.
 * @param position - позиция заказа
 * @param promotional - промокод
 * @returns true, если позиция участвует в скидке по промокоду
 */
const isPositionEligibleForPromotional = (position: OrderPositionInterface, promotional: PromotionalInterface) => {
  if (!promotional.items?.length) {
    return true;
  }
  if (_.isNil(position.item?.id)) {
    return false;
  }
  return promotional.items.some(({ id }) => id === position.item.id);
};

/**
 * Возвращает позиции, на которые распространяется промокод с привязкой к товарам.
 * @param positions - позиции заказа
 * @param promotional - промокод
 * @returns подходящие позиции
 */
const getEligiblePositions = (positions: OrderPositionInterface[], promotional: PromotionalInterface) => positions.filter(
  (position) => isPositionEligibleForPromotional(position, promotional),
);

/**
 * Проверяет, используется ли фиксированная скидка с привязкой к товарам.
 * @param promotional - промокод
 * @returns true для фиксированной товарной скидки
 */
const isItemRestrictedFixedDiscount = (promotional?: PromotionalInterface) => Boolean(
  promotional?.discount
  && promotional.items?.length
  && !promotional.discountPercent
  && !promotional.buyTwoGetOne,
);

/**
 * Распределяет фиксированную скидку по позициям пропорционально их стоимости.
 * @param positions - подходящие позиции
 * @param totalDiscountAmount - общая сумма скидки в рублях
 * @returns скидка по id позиции
 */
const distributeFixedDiscountAcrossPositions = (positions: OrderPositionInterface[], totalDiscountAmount: number) => {
  const discountByPosition: Record<string | number, number> = {};
  if (!positions.length || !totalDiscountAmount) {
    return discountByPosition;
  }

  const eligibleTotalInCents = positions.reduce(
    (acc, position) => acc + Math.round(getPositionPrice(position) * 100),
    0,
  );
  const totalDiscountInCents = Math.round(totalDiscountAmount * 100);
  let allocatedDiscountInCents = 0;

  positions.forEach((position, positionIndex) => {
    const positionPriceInCents = Math.round(getPositionPrice(position) * 100);
    const positionDiscountInCents = positionIndex === positions.length - 1
      ? totalDiscountInCents - allocatedDiscountInCents
      : Math.floor((totalDiscountInCents * positionPriceInCents) / eligibleTotalInCents);

    if (positionIndex !== positions.length - 1) {
      allocatedDiscountInCents += positionDiscountInCents;
    }

    discountByPosition[position.id] = +(positionDiscountInCents / 100).toFixed(2);
  });

  return discountByPosition;
};

/**
 * Считает сумму фиксированной скидки для промокода, привязанного к товарам.
 * @param order - заказ
 * @returns скидка в рублях, не больше суммы подходящих товаров
 */
const getItemRestrictedFixedDiscountAmount = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>) => {
  const { promotional, positions } = order;
  if (!promotional || !isItemRestrictedFixedDiscount(promotional)) {
    return 0;
  }

  const eligiblePositions = getEligiblePositions(positions, promotional);
  const eligibleTotal = eligiblePositions.reduce(
    (acc, position) => acc + getPositionPrice(position),
    0,
  );

  return Math.min(promotional.discount ?? 0, eligibleTotal);
};

/**
 * Возвращает распределение фиксированной товарной скидки по позициям.
 * @param order - заказ
 * @returns скидка по id позиции
 */
const getItemRestrictedFixedDiscountByPosition = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>) => {
  const { promotional } = order;
  if (!promotional || !isItemRestrictedFixedDiscount(promotional)) {
    return {} as Record<string | number, number>;
  }

  const eligiblePositions = getEligiblePositions(order.positions, promotional);
  const orderDiscountAmount = getItemRestrictedFixedDiscountAmount(order);

  return distributeFixedDiscountAcrossPositions(eligiblePositions, orderDiscountAmount);
};

/**
 * Возвращает итоговую цену позиции после применения промокода.
 * @param position - позиция заказа
 * @param order - заказ
 * @returns цена позиции в рублях
 */
export const getPositionPriceAfterPromotional = (position: OrderPositionInterface, order: Omit<OrderInterface, 'error' | 'loadingStatus'>) => {
  const { promotional } = order;
  const positionPrice = getPositionPrice(position);

  if (!promotional) {
    return positionPrice;
  }

  if (isItemRestrictedFixedDiscount(promotional)) {
    if (!isPositionEligibleForPromotional(position, promotional)) {
      return positionPrice;
    }

    const discountByPosition = getItemRestrictedFixedDiscountByPosition(order);
    const positionDiscount = discountByPosition[position.id] ?? 0;

    return +(positionPrice - positionDiscount).toFixed(2);
  }

  let positionDiscountPercent = getDiscountPercent(order.positions, order.deliveryPrice, promotional);
  if (promotional.items?.length && !isPositionEligibleForPromotional(position, promotional)) {
    positionDiscountPercent = 0;
  }

  return getPositionPriceWithDiscount(position, positionDiscountPercent);
};

export const getDiscountPercent = (positions: OrderPositionInterface[], deliveryPrice: number, promotional?: PromotionalInterface) => {
  if (promotional?.buyTwoGetOne) {
    return 0;
  }

  const price = getPositionsPrice(positions, deliveryPrice);

  if (!price) {
    return 0;
  }

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

  if (isItemRestrictedFixedDiscount(promotional)) {
    return +getItemRestrictedFixedDiscountAmount(order).toFixed(2);
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
    const goodsTotal = order.positions.reduce((acc, position, positionIndex) => {
      if (isPositionInBuyTwoGetOneDiscountPool(position, restrictedItemIds)) {
        const lineKey = getPositionLineKey(position, positionIndex);
        return acc + (paidByLineKey[lineKey] ?? 0);
      }
      return acc + getPositionPrice(position);
    }, 0);
    return Math.max(0, +(goodsTotal + order.deliveryPrice).toFixed(2));
  }

  const discount = getOrderDiscount(order);

  const totalPrice = getPositionsPrice(order.positions, order.deliveryPrice);

  return Math.max(0, +(totalPrice - discount).toFixed(2));
};

export const getPositionAmount = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>) => {
  const promotional = order.promotional;
  if (promotional?.buyTwoGetOne) {
    const restrictedItemIds = getBuyTwoGetOneRestrictedItemIds(promotional);
    const { paidByLineKey } = computeBuyTwoGetOneBreakdown(order.positions, promotional);
    return order.positions.reduce((acc, position, positionIndex) => {
      const rowKey = position.id !== undefined && position.id !== null ? position.id : getPositionLineKey(position, positionIndex);
      if (isPositionInBuyTwoGetOneDiscountPool(position, restrictedItemIds)) {
        const lineKey = getPositionLineKey(position, positionIndex);
        acc[rowKey] = +(paidByLineKey[lineKey] ?? 0).toFixed(2);
      } else {
        acc[rowKey] = getPositionPrice(position);
      }
      return acc;
    }, {} as Record<string | number, number>);
  }

  const positionsAmount = order.positions.reduce((acc, position) => {
    acc[position.id] = getPositionPriceAfterPromotional(position, order);
    return acc;
  }, {} as Record<number, number>);

  return positionsAmount;
};

/**
 * Формирует поштучные суммы позиций на базе общей логики расчёта заказа.
 * @param order - заказ, для которого нужен поштучный расчёт
 * @returns список сумм по единицам с индексом исходной позиции
 */
export const getOrderUnitAmounts = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>): OrderUnitAmountInterface[] => {
  const promotional = order.promotional;
  if (promotional?.buyTwoGetOne) {
    const restrictedItemIds = getBuyTwoGetOneRestrictedItemIds(promotional);
    const { unitPaidByLineKey } = computeBuyTwoGetOneBreakdown(order.positions, promotional);

    return order.positions.flatMap((position, positionIndex) => {
      if (isPositionInBuyTwoGetOneDiscountPool(position, restrictedItemIds)) {
        const lineKey = getPositionLineKey(position, positionIndex);
        const lineUnitAmounts = unitPaidByLineKey[lineKey] || [];
        return lineUnitAmounts.map((amount) => ({ positionIndex, amount: +amount.toFixed(2) }));
      }

      const lineAmount = getPositionPrice(position);
      const lineUnitAmounts = splitLineAmountToUnitAmounts(lineAmount, position.count);
      return lineUnitAmounts.map((amount) => ({ positionIndex, amount }));
    });
  }

  return order.positions.flatMap((position, positionIndex) => {
    const lineAmount = getPositionPriceAfterPromotional(position, order);
    const lineUnitAmounts = splitLineAmountToUnitAmounts(lineAmount, position.count);
    return lineUnitAmounts.map((amount) => ({ positionIndex, amount }));
  });
};
