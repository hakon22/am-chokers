import type { OrderInterface } from '@/types/order/Order';
import type { OrderPositionInterface } from '@/types/order/OrderPosition';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';

export const getPositionsPrice = (positions: OrderInterface['positions'], deliveryPrice = 0, withoutDiscount = false) => +(positions.reduce((acc, position) => acc + ((position.price * 100) - (withoutDiscount ? 0 : position.discountPrice * 100)) * position.count, deliveryPrice * 100) / 100).toFixed(2);

export const getPositionPrice = (position: OrderPositionInterface) => +(((position.price * 100) - (position.discountPrice * 100)) * position.count / 100).toFixed(2);

export const getDiscountPercent = (positions: OrderInterface['positions'], deliveryPrice: number, promotional?: PromotionalInterface) => {
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

export const getOrderDiscount = (order: OrderInterface) => {
  const percent = getDiscountPercent(order.positions, order.deliveryPrice, order.promotional);

  const totalDiscount = order.positions.reduce((acc, position) => acc + (getPositionPrice(position) - (getPositionPriceWithDiscount(position, percent))), 0);

  const orderDiscount = totalDiscount + ((order.deliveryPrice * 100) - ((order.deliveryPrice * 100) - ((order.deliveryPrice * 100 * percent) / 100))) / 100;

  return +orderDiscount.toFixed(2);
};

export const getOrderPrice = (order: OrderInterface) => {
  const discount = getOrderDiscount(order);

  const totalPrice = getPositionsPrice(order.positions, order.deliveryPrice);

  return +(totalPrice - discount).toFixed(2);
};
