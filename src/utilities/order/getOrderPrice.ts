import type { OrderInterface } from '@/types/order/Order';
import type { PromotionalInterface } from '@/types/promotional/PromotionalInterface';
import type { OrderEntity } from '@server/db/entities/order.entity';

const getTotalPrice = (positions: OrderInterface['positions'], deliveryPrice: number) => positions.reduce((acc, position) => acc + (position.price - position.discountPrice) * position.count, 0) + deliveryPrice;

export const getDiscount = (price: number, promotional?: PromotionalInterface) => {
  const discount = (promotional ? promotional.discount || (price * (promotional.discountPercent / 100)) : 0).toFixed(2);

  return price > +discount ? discount : price - 1;
};

export const getOrderDiscount = (order: OrderInterface) => {
  const totalPrice = getTotalPrice(order.positions, order.deliveryPrice);

  return getDiscount(totalPrice, order.promotional);
};

export const getOrderPrice = (order: OrderInterface | OrderEntity) => {
  const totalPrice = getTotalPrice(order.positions, order.deliveryPrice);

  return (totalPrice - +getDiscount(totalPrice, order.promotional)).toFixed(2);
};

export const getPrice = (price: number, promotional?: PromotionalInterface) => (price - +getDiscount(price, promotional)).toFixed(2);
