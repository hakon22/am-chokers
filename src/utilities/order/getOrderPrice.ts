import type { OrderInterface } from '@/types/order/Order';
import type { OrderPositionInterface } from '@/types/order/OrderPosition';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';

export const getPositionsPrice = (positions: OrderInterface['positions']) => +(positions.reduce((acc, position) => acc + ((position.price * 100) - (position.discountPrice * 100)) * position.count, 0) / 100).toFixed(2);

export const getPositionPrice = (position: OrderPositionInterface) => +(((position.price * 100) - (position.discountPrice * 100)) * position.count / 100).toFixed(2);

export const getDiscountPercent = (positions: OrderInterface['positions'], promotional?: PromotionalInterface) => {
  const price = getPositionsPrice(positions);

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
  const percent = getDiscountPercent(order.positions, order.promotional);

  const totalDiscount = order.positions.reduce((acc, position) => acc + (getPositionPrice(position) - (getPositionPriceWithDiscount(position, percent))), 0);

  const orderDiscount = totalDiscount / 100;

  return +orderDiscount.toFixed(2);
};

export const getOrderPrice = (order: OrderInterface) => {
  const discount = getOrderDiscount(order);

  const totalPrice = getPositionsPrice(order.positions);

  return +(totalPrice - discount).toFixed(2);
};
