import type { OrderInterface } from '@/types/order/Order';

export const getOrderPrice = (order: OrderInterface) => Math.floor(order.positions.reduce((acc, position) => acc + (position.price - position.discountPrice) * position.count, 0));
