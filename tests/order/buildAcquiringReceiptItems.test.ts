import { describe, expect, it } from 'vitest';

import { buildAcquiringReceiptItems } from '@/utilities/order/buildAcquiringReceiptItems';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';

import {
  getAcquiringReceiptTotal,
  makeOrder,
  makePickupOrder,
  makePosition,
  makePromotional,
  makeOrderWithFreeDeliveryByThreshold,
} from './getOrderPrice.fixtures';

const sumReceiptItems = (items: ReturnType<typeof buildAcquiringReceiptItems>['items']) => +items
  .reduce((acc, item) => acc + +item.amount.value, 0)
  .toFixed(2);

describe('buildAcquiringReceiptItems', () => {
  it('J1: fixed item discount 4000+300', () => {
    const order = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
    });

    const { items, amount } = buildAcquiringReceiptItems(order);

    expect(amount).toBe(3300);
    expect(sumReceiptItems(items)).toBe(3300);
    expect(getAcquiringReceiptTotal(order)).toBe(3300);
  });

  it('J2: buy two get one 3×1000+300', () => {
    const order = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 1000, count: 3 })],
      deliveryPrice: 300,
      promotional: makePromotional({ buyTwoGetOne: true }),
    });

    const { items, amount } = buildAcquiringReceiptItems(order);

    expect(amount).toBe(2301);
    expect(sumReceiptItems(items)).toBe(2301);
    expect(items[0].amount.value).toBe('2001');
  });

  it('J3: order-wide percent promo matches getOrderPrice', () => {
    const order = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makePromotional({ discountPercent: 25 }),
    });

    const { items, amount } = buildAcquiringReceiptItems(order);

    expect(amount).toBe(getOrderPrice(order));
    expect(sumReceiptItems(items)).toBe(getOrderPrice(order));
  });

  it('J4: corrects cent difference on first line item', () => {
    const order = makeOrder({
      positions: [
        makePosition({ id: 1, itemId: 10, price: 1000, count: 1 }),
        makePosition({ id: 2, itemId: 20, price: 1000, count: 1 }),
        makePosition({ id: 3, itemId: 30, price: 1000, count: 1 }),
      ],
      deliveryPrice: 0,
      promotional: makePromotional({ discount: 1000, items: [{ id: 10 }, { id: 20 }, { id: 30 }] }),
    });

    const { items, amount } = buildAcquiringReceiptItems(order);

    expect(amount).toBe(2000);
    expect(sumReceiptItems(items)).toBe(amount);
  });

  it('J5: pickup order has no delivery line', () => {
    const order = makePickupOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
    });

    const { items } = buildAcquiringReceiptItems(order);

    expect(items.some((item) => item.description === 'Доставка')).toBe(false);
    expect(getAcquiringReceiptTotal(order)).toBe(4000);
  });

  it('J6: threshold free delivery includes only goods lines', () => {
    const order = makeOrderWithFreeDeliveryByThreshold(
      [makePosition({ id: 1, itemId: 10, price: 12000 })],
    );

    const { items } = buildAcquiringReceiptItems(order);

    expect(items).toHaveLength(1);
    expect(items[0].description).toBe('Товар');
    expect(items[0].amount.value).toBe('12000');
  });

  it('includes delivery translation for paid delivery', () => {
    const order = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000, name: 'Колье' })],
      deliveryPrice: 300,
    });

    const { items } = buildAcquiringReceiptItems(order);
    const deliveryItem = items.find((item) => item.description === 'Доставка');

    expect(deliveryItem).toBeDefined();
    expect(deliveryItem?.amount.currency).toBe('RUB');
    expect(deliveryItem?.quantity).toBe('1');
  });

  it('J7: fractional delivery 234.56 in receipt', () => {
    const order = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 234.56,
    });

    const { items, amount } = buildAcquiringReceiptItems(order);

    expect(amount).toBe(4234.56);
    expect(sumReceiptItems(items)).toBe(4234.56);
    expect(items.find((item) => item.description === 'Доставка')?.amount.value).toBe('234.56');
  });

  it('J8: fractional delivery 267.13 with percent order-wide promo', () => {
    const order = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 267.13,
      promotional: makePromotional({ discountPercent: 25 }),
    });

    const { items, amount } = buildAcquiringReceiptItems(order);

    expect(amount).toBe(3200.35);
    expect(sumReceiptItems(items)).toBe(3200.35);
    expect(getOrderPrice(order)).toBe(amount);
  });
});
