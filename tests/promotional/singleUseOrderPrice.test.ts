import { describe, expect, it } from 'vitest';

import { getOrderDiscount, getOrderPrice } from '@/utilities/order/getOrderPrice';

import {
  makeOrder,
  makeOrderAfterSingleUseStripped,
  makePosition,
  makeSingleUsePersonalPromo,
} from '@tests/promotional/singleUse.fixtures';

describe('singleUse order price after strip', () => {
  it('N1: fixed item discount 4000+300', () => {
    const withPromo = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ discount: 1000, items: [{ id: 10 }] }),
    });
    const stripped = makeOrderAfterSingleUseStripped(withPromo);

    expect(getOrderPrice(withPromo)).toBe(3300);
    expect(getOrderPrice(stripped)).toBe(4300);
  });

  it('N2: order-wide percent 25%', () => {
    const withPromo = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ discountPercent: 25 }),
    });
    const stripped = makeOrderAfterSingleUseStripped(withPromo);

    expect(getOrderPrice(withPromo)).toBe(3225);
    expect(getOrderPrice(stripped)).toBe(4300);
  });

  it('N3: item-restricted percent 25%', () => {
    const withPromo = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ discountPercent: 25, items: [{ id: 10 }] }),
    });
    const stripped = makeOrderAfterSingleUseStripped(withPromo);

    expect(getOrderPrice(withPromo)).toBe(3300);
    expect(getOrderPrice(stripped)).toBe(4300);
  });

  it('N4: freeDelivery', () => {
    const withPromo = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 0,
      promotional: makeSingleUsePersonalPromo({ freeDelivery: true }),
    });
    const stripped = makeOrderAfterSingleUseStripped(withPromo);

    expect(getOrderPrice(withPromo)).toBe(4000);
    expect(getOrderPrice(stripped)).toBe(4300);
  });

  it('N5: buyTwoGetOne', () => {
    const withPromo = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 1000, count: 3 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ buyTwoGetOne: true }),
    });
    const stripped = makeOrderAfterSingleUseStripped(withPromo);

    expect(getOrderPrice(withPromo)).toBe(2301);
    expect(getOrderPrice(stripped)).toBe(3300);
  });

  it('N6: fixed on ineligible item — strip does not change total', () => {
    const withPromo = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ discount: 1000, items: [{ id: 99 }] }),
    });
    const stripped = makeOrderAfterSingleUseStripped(withPromo);

    expect(getOrderPrice(withPromo)).toBe(4300);
    expect(getOrderPrice(stripped)).toBe(4300);
  });

  it('N7: getOrderDiscount becomes 0 after strip', () => {
    const withPromo = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ discount: 1000, items: [{ id: 10 }] }),
    });
    const stripped = makeOrderAfterSingleUseStripped(withPromo);

    expect(getOrderDiscount(withPromo)).toBeGreaterThan(0);
    expect(getOrderDiscount(stripped)).toBe(0);
  });

  it('N8: second unpaid order shows full price after strip', () => {
    const firstPaid = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ discount: 1000, items: [{ id: 10 }] }),
    });
    const secondUnpaid = makeOrderAfterSingleUseStripped(
      makeOrder({
        positions: [makePosition({ id: 2, itemId: 10, price: 4000 })],
        deliveryPrice: firstPaid.deliveryPrice,
        promotional: firstPaid.promotional,
      }),
    );

    expect(getOrderPrice(firstPaid)).toBe(3300);
    expect(getOrderPrice(secondUnpaid)).toBe(4300);
  });
});
