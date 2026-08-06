import { describe, expect, it } from 'vitest';

import { buildAcquiringReceiptItems } from '@/utilities/order/buildAcquiringReceiptItems';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';

import { getAcquiringReceiptTotal } from '@tests/order/getOrderPrice.fixtures';
import {
  makeOrder,
  makeOrderAfterSingleUseStripped,
  makePosition,
  makeSingleUsePersonalPromo,
} from '@tests/promotional/singleUse.fixtures';

describe('singleUse acquiring receipt after strip', () => {
  it('O1: stripped fixed discount order totals 4300', () => {
    const stripped = makeOrderAfterSingleUseStripped(makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ discount: 1000, items: [{ id: 10 }] }),
    }));

    const { amount } = buildAcquiringReceiptItems(stripped);

    expect(amount).toBe(4300);
    expect(getOrderPrice(stripped)).toBe(4300);
  });

  it('O2: stripped freeDelivery includes delivery line', () => {
    const stripped = makeOrderAfterSingleUseStripped(makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 0,
      promotional: makeSingleUsePersonalPromo({ freeDelivery: true }),
    }));

    const { items, amount } = buildAcquiringReceiptItems(stripped);

    expect(amount).toBe(4300);
    expect(items.some((item) => item.description === 'Доставка')).toBe(true);
  });

  it('O3: stripped buyTwoGetOne totals 3300', () => {
    const stripped = makeOrderAfterSingleUseStripped(makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 1000, count: 3 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ buyTwoGetOne: true }),
    }));

    const { amount } = buildAcquiringReceiptItems(stripped);

    expect(amount).toBe(3300);
    expect(amount).not.toBe(2301);
  });

  it('O4: stripped amount is greater than with promo', () => {
    const withPromo = makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ discount: 1000, items: [{ id: 10 }] }),
    });
    const stripped = makeOrderAfterSingleUseStripped(withPromo);

    expect(buildAcquiringReceiptItems(stripped).amount).toBeGreaterThan(buildAcquiringReceiptItems(withPromo).amount);
  });

  it('O5: receipt total matches getOrderPrice', () => {
    const stripped = makeOrderAfterSingleUseStripped(makeOrder({
      positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
      deliveryPrice: 300,
      promotional: makeSingleUsePersonalPromo({ discountPercent: 25 }),
    }));

    expect(getAcquiringReceiptTotal(stripped)).toBe(getOrderPrice(stripped));
  });
});
