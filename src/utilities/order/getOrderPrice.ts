import type { OrderInterface } from '@/types/order/Order';
import type { OrderPositionInterface } from '@/types/order/OrderPosition';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';

export const truncateLastDecimal = (num: number) => {
  // Преобразуем число в строку
  let numStr = num.toString();

  // Проверяем, есть ли в строке символ запятой
  const decimalIndex = numStr.indexOf('.');
  if (decimalIndex !== -1) {
    // Получаем часть числа после запятой
    const decimalPart = numStr.slice(decimalIndex + 1);

    // Если у числа два знака после запятой
    if (decimalPart.length === 2) {
      // Обрезаем последний знак после запятой
      numStr = numStr.slice(0, decimalIndex + 2);
    }
    if (decimalPart.length > 5) {
      // Обрезаем последний знак после запятой
      numStr = Number(numStr).toFixed(2);
    }
  }

  // Преобразуем обратно в число и возвращаем его
  return parseFloat(numStr);
};

export const getPositionsPrice = (positions: OrderInterface['positions'], deliveryPrice: number) => positions.reduce((acc, position) => acc + (position.price - position.discountPrice) * position.count, deliveryPrice);

export const getPositionPrice = (position: OrderPositionInterface) => (position.price - position.discountPrice) * position.count;

export const getDiscountPercent = (positions: OrderInterface['positions'], deliveryPrice: number, promotional?: PromotionalInterface) => {
  const price = getPositionsPrice(positions, deliveryPrice);

  const discountPercent = promotional
    ? promotional.discountPercent || (100 - ((price - promotional.discount) * 100 / price))
    : 0;

  return { percent: discountPercent, amount: promotional?.discount };
};

export const getPositionPriceWithDiscount = (position: OrderPositionInterface, percent: number) => {
  const price = getPositionPrice(position);
  const discount = (price * percent) / 100;

  return truncateLastDecimal(price - discount);
};

export const getOrderDiscount = (order: OrderInterface) => {
  const { percent, amount } = getDiscountPercent(order.positions, order.deliveryPrice, order.promotional);

  const totalDiscount = truncateLastDecimal(order.positions.reduce((acc, position) => acc + truncateLastDecimal(getPositionPrice(position) - truncateLastDecimal(getPositionPriceWithDiscount(position, percent))), 0));

  const orderDiscount = truncateLastDecimal(totalDiscount) + truncateLastDecimal(order.deliveryPrice - (order.deliveryPrice - truncateLastDecimal((order.deliveryPrice * percent) / 100)));

  const split = orderDiscount.toString().split('.');

  const balance = split.length === 2 ? split.at(-1) : 0;

  return amount && balance ? truncateLastDecimal(orderDiscount - +`0.${balance}`) : orderDiscount;
};

export const getOrderPrice = (order: OrderInterface) => {
  const discount = getOrderDiscount(order);

  const totalPrice = getPositionsPrice(order.positions, order.deliveryPrice);

  return truncateLastDecimal(totalPrice - discount);
};
