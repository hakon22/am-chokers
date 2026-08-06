import { describe, expect, it } from 'vitest';

import {
  computeBuyTwoGetOneBreakdown,
  getDiscountPercent,
  getPositionPrice,
  getPositionPriceWithDiscount,
  getPositionsPrice,
} from '@/utilities/order/getOrderPrice';
import { buildAcquiringReceiptItems } from '@/utilities/order/buildAcquiringReceiptItems';
import { PRICE_FOR_FREE_DELIVERY_RUB } from '@shared/delivery-config';

import {
  assertUnitAmountsMatchLineAmount,
  getAcquiringReceiptTotal,
  getOrderDiscount,
  getOrderPrice,
  makeOrder,
  makePickupOrder,
  makePosition,
  makePromotional,
  makeOrderWithFreeDeliveryByThreshold,
} from '@tests/order/getOrderPrice.fixtures';

describe('getOrderPrice', () => {
  describe('fixed discount', () => {
    it('A1: fixed discount on item, 4000+300−1000', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(3300);
      expect(getOrderDiscount(order)).toBe(1000);
    });

    it('A2: caps fixed discount at eligible goods total', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 800 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(300);
      expect(getOrderDiscount(order)).toBe(800);
    });

    it('A3: fixed discount without item restriction', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000 }),
      });

      expect(getOrderPrice(order)).toBe(3300);
      expect(getOrderDiscount(order)).toBe(1000);
    });

    it('A4: distributes fixed discount across two eligible positions', () => {
      const order = makeOrder({
        positions: [
          makePosition({ id: 1, itemId: 10, price: 3000 }),
          makePosition({ id: 2, itemId: 10, price: 1000 }),
        ],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(3300);
      expect(getOrderDiscount(order)).toBe(1000);
    });

    it('A5: fixed discount only on eligible item in mixed cart', () => {
      const order = makeOrder({
        positions: [
          makePosition({ id: 1, itemId: 10, price: 4000 }),
          makePosition({ id: 2, itemId: 20, price: 2000 }),
        ],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(5300);
      expect(getOrderDiscount(order)).toBe(1000);
    });

    it('A6: fixed discount with catalog discount price', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 5000, discountPrice: 1000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(3300);
      expect(getOrderDiscount(order)).toBe(1000);
    });

    it('A7: fixed discount with multiple units of same item', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 2000, count: 2 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(3300);
      expect(getOrderDiscount(order)).toBe(1000);
    });
  });

  describe('percent discount', () => {
    it('B1: 25% on item keeps delivery unchanged', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discountPercent: 25, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(3300);
      expect(getOrderDiscount(order)).toBe(1000);
    });

    it('B2: 25% on whole order includes delivery', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discountPercent: 25 }),
      });

      expect(getOrderPrice(order)).toBe(3225);
      expect(getOrderDiscount(order)).toBe(1075);
    });

    it('B3: percent discount only on eligible item', () => {
      const order = makeOrder({
        positions: [
          makePosition({ id: 1, itemId: 10, price: 4000 }),
          makePosition({ id: 2, itemId: 20, price: 2000 }),
        ],
        deliveryPrice: 300,
        promotional: makePromotional({ discountPercent: 10, items: [{ id: 10 }] }),
      });

      expect(getOrderDiscount(order)).toBe(400);
      expect(getOrderPrice(order)).toBe(5900);
    });
  });

  describe('free delivery promo', () => {
    it('C1: zero delivery price charges goods only', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 0,
      });

      expect(getOrderPrice(order)).toBe(4000);
      expect(getOrderDiscount(order)).toBe(0);
    });
  });

  describe('pickup (no delivery)', () => {
    it.each([
      ['H1: pickup without promo', undefined, 4000, 0],
      ['H2: pickup + fixed item discount', makePromotional({ discount: 1000, items: [{ id: 10 }] }), 3000, 1000],
      ['H3: pickup + percent item discount', makePromotional({ discountPercent: 25, items: [{ id: 10 }] }), 3000, 1000],
      ['H5: pickup + fixed order-wide discount', makePromotional({ discount: 1000 }), 3000, 1000],
    ])('%s', (_, promotional, expectedPrice, expectedDiscount) => {
      const order = makePickupOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        promotional,
      });

      expect(getOrderPrice(order)).toBe(expectedPrice);
      expect(getOrderDiscount(order)).toBe(expectedDiscount);
      expect(getAcquiringReceiptTotal(order)).toBe(expectedPrice);
    });

    it('H4: pickup + buy two get one', () => {
      const order = makePickupOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 1000, count: 3 })],
        promotional: makePromotional({ buyTwoGetOne: true }),
      });

      expect(getOrderPrice(order)).toBe(2001);
      expect(getOrderDiscount(order)).toBe(999);
      expect(getAcquiringReceiptTotal(order)).toBe(2001);
    });
  });

  describe('free delivery by 10000 threshold', () => {
    it.each([
      ['I1: goods 12000', [makePosition({ id: 1, itemId: 10, price: 12000 })], undefined, 12000, 0],
      ['I2: goods 10500 on threshold edge', [makePosition({ id: 1, itemId: 10, price: 10500 })], undefined, 10500, 0],
      ['I6: goods exactly 10000', [makePosition({ id: 1, itemId: 10, price: 10000 })], undefined, 10000, 0],
    ])('%s', (_, positions, promotional, expectedPrice, expectedDiscount) => {
      const order = makeOrderWithFreeDeliveryByThreshold(positions, promotional);

      expect(getOrderPrice(order)).toBe(expectedPrice);
      expect(getOrderDiscount(order)).toBe(expectedDiscount);
    });

    it('I3: goods 12000 + fixed item discount', () => {
      const order = makeOrderWithFreeDeliveryByThreshold(
        [makePosition({ id: 1, itemId: 10, price: 12000 })],
        makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      );

      expect(getOrderPrice(order)).toBe(11000);
      expect(getOrderDiscount(order)).toBe(1000);
    });

    it('I4: goods 12000 + 10% order-wide discount', () => {
      const order = makeOrderWithFreeDeliveryByThreshold(
        [makePosition({ id: 1, itemId: 10, price: 12000 })],
        makePromotional({ discountPercent: 10 }),
      );

      expect(getOrderPrice(order)).toBe(10800);
      expect(getOrderDiscount(order)).toBe(1200);
    });

    it('I5: goods below threshold keeps paid delivery', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 9999 })],
        deliveryPrice: 300,
      });

      expect(getOrderPrice(order)).toBe(10299);
    });

    it('documents threshold constant used by cart', () => {
      expect(PRICE_FOR_FREE_DELIVERY_RUB).toBe(10000);
    });
  });

  describe('buy two get one', () => {
    it('D1: 3 items at 1000 + delivery 300', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 1000, count: 3 })],
        deliveryPrice: 300,
        promotional: makePromotional({ buyTwoGetOne: true }),
      });

      expect(getOrderPrice(order)).toBe(2301);
      expect(getOrderDiscount(order)).toBe(999);
    });

    it('D2: 6 items at 1000 gives two gift units', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 1000, count: 6 })],
        deliveryPrice: 300,
        promotional: makePromotional({ buyTwoGetOne: true }),
      });

      expect(getOrderPrice(order)).toBe(4302);
      expect(getOrderDiscount(order)).toBe(1998);
    });

    it('D3: item-restricted buy two get one', () => {
      const order = makeOrder({
        positions: [
          makePosition({ id: 1, itemId: 10, price: 1000, count: 3 }),
          makePosition({ id: 2, itemId: 20, price: 500, count: 3 }),
        ],
        deliveryPrice: 300,
        promotional: makePromotional({ buyTwoGetOne: true, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(2802);
      expect(getOrderDiscount(order)).toBe(1998);
    });

    it('D4: mixed cart applies gifts only to eligible items', () => {
      const order = makeOrder({
        positions: [
          makePosition({ id: 1, itemId: 10, price: 1000, count: 3 }),
          makePosition({ id: 2, itemId: 20, price: 2000, count: 1 }),
        ],
        deliveryPrice: 300,
        promotional: makePromotional({ buyTwoGetOne: true, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(4301);
      expect(getOrderDiscount(order)).toBe(999);
    });

    it('D5: gift applies to cheapest unit', () => {
      const order = makeOrder({
        positions: [
          makePosition({ id: 1, itemId: 10, price: 500, count: 1 }),
          makePosition({ id: 2, itemId: 20, price: 1000, count: 1 }),
          makePosition({ id: 3, itemId: 30, price: 1500, count: 1 }),
        ],
        deliveryPrice: 300,
        promotional: makePromotional({ buyTwoGetOne: true }),
      });

      expect(getOrderPrice(order)).toBe(2801);
      expect(getOrderDiscount(order)).toBe(499);
    });

    it('D6: fewer than 3 items has no gift', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 1000, count: 2 })],
        deliveryPrice: 300,
        promotional: makePromotional({ buyTwoGetOne: true }),
      });

      expect(getOrderPrice(order)).toBe(2300);
      expect(getOrderDiscount(order)).toBe(0);
    });

    it('D7: buy two get one breakdown is internally consistent', () => {
      const promotional = makePromotional({ buyTwoGetOne: true });
      const positions = [makePosition({ id: 1, itemId: 10, price: 1000, count: 3 })];
      const { eligibleFullTotal, eligiblePaidTotal } = computeBuyTwoGetOneBreakdown(positions, promotional);

      expect(+(eligibleFullTotal - eligiblePaidTotal).toFixed(2)).toBe(999);
    });
  });

  describe('receipt consistency', () => {
    const receiptScenarios: [string, ReturnType<typeof makeOrder>][] = [
      ['fixed item A1', makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      })],
      ['fixed order A3', makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000 }),
      })],
      ['percent item B1', makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discountPercent: 25, items: [{ id: 10 }] }),
      })],
      ['percent order B2', makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discountPercent: 25 }),
      })],
      ['buy two get one D1', makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 1000, count: 3 })],
        deliveryPrice: 300,
        promotional: makePromotional({ buyTwoGetOne: true }),
      })],
      ['pickup H2', makePickupOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      })],
      ['threshold I3', makeOrderWithFreeDeliveryByThreshold(
        [makePosition({ id: 1, itemId: 10, price: 12000 })],
        makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      )],
    ];

    it.each(receiptScenarios)('%s: receipt total matches order price', (_, order) => {
      expect(getAcquiringReceiptTotal(order)).toBe(getOrderPrice(order));
      assertUnitAmountsMatchLineAmount(order);
    });
  });

  describe('edge cases', () => {
    it('F1: empty cart with item-restricted fixed promo keeps delivery', () => {
      const order = makeOrder({
        positions: [],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(300);
      expect(getOrderDiscount(order)).toBe(0);
    });

    it('F2: empty cart with order-wide fixed promo is non-negative', () => {
      const order = makeOrder({
        positions: [],
        deliveryPrice: 0,
        promotional: makePromotional({ discount: 1000 }),
      });

      expect(getOrderPrice(order)).toBe(0);
    });

    it('F3: empty cart with order-wide percent promo is non-negative', () => {
      const order = makeOrder({
        positions: [],
        deliveryPrice: 0,
        promotional: makePromotional({ discountPercent: 25 }),
      });

      expect(getOrderPrice(order)).toBe(0);
    });

    it('F4: getOrderPrice never returns negative values', () => {
      const orders = [
        makeOrder({ positions: [], deliveryPrice: 300, promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }) }),
        makeOrder({ positions: [], deliveryPrice: 0, promotional: makePromotional({ discount: 1000 }) }),
        makeOrder({ positions: [], deliveryPrice: 0, promotional: makePromotional({ discountPercent: 25 }) }),
      ];

      orders.forEach((order) => {
        expect(getOrderPrice(order)).toBeGreaterThanOrEqual(0);
      });
    });

    it('F5: delivery line is not discounted by item-restricted fixed promo', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getAcquiringReceiptTotal(order)).toBe(3300);
    });

    it('F6: fixed discount allocation sums to order discount', () => {
      const order = makeOrder({
        positions: [
          makePosition({ id: 1, itemId: 10, price: 1000, count: 1 }),
          makePosition({ id: 2, itemId: 10, price: 1000, count: 1 }),
          makePosition({ id: 3, itemId: 10, price: 1000, count: 1 }),
        ],
        deliveryPrice: 300,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getOrderDiscount(order)).toBe(1000);
      expect(getOrderPrice(order)).toBe(2300);
    });
  });

  describe('fractional amounts', () => {
    it.each([
      ['234.56', 234.56, 4234.56],
      ['267.13', 267.13, 4267.13],
    ])('goods 4000 + delivery %s without promo', (_, deliveryPrice, expectedPrice) => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice,
      });

      expect(getOrderPrice(order)).toBe(expectedPrice);
      expect(getAcquiringReceiptTotal(order)).toBe(expectedPrice);
    });

    it.each([
      ['234.56', 234.56, 3234.56, 1000],
      ['267.13', 267.13, 3267.13, 1000],
    ])('fixed item discount with delivery %s', (_, deliveryPrice, expectedPrice, expectedDiscount) => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice,
        promotional: makePromotional({ discount: 1000, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(expectedPrice);
      expect(getOrderDiscount(order)).toBe(expectedDiscount);
      expect(getAcquiringReceiptTotal(order)).toBe(expectedPrice);
    });

    it.each([
      ['234.56', 234.56, 3234.56],
      ['267.13', 267.13, 3267.13],
    ])('percent item discount keeps fractional delivery %s', (_, deliveryPrice, expectedPrice) => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice,
        promotional: makePromotional({ discountPercent: 25, items: [{ id: 10 }] }),
      });

      expect(getOrderPrice(order)).toBe(expectedPrice);
      expect(getAcquiringReceiptTotal(order)).toBe(expectedPrice);
    });

    it.each([
      ['234.56', 234.56, 3175.92, 1058.64],
      ['267.13', 267.13, 3200.35, 1066.78],
    ])('percent order-wide discount with delivery %s', (_, deliveryPrice, expectedPrice, expectedDiscount) => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice,
        promotional: makePromotional({ discountPercent: 25 }),
      });

      expect(getOrderPrice(order)).toBe(expectedPrice);
      expect(getOrderDiscount(order)).toBe(expectedDiscount);
      expect(getAcquiringReceiptTotal(order)).toBe(expectedPrice);
    });

    it('fractional goods and fractional delivery', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 1234.56 })],
        deliveryPrice: 267.13,
      });

      expect(getOrderPrice(order)).toBe(1501.69);
      expect(getAcquiringReceiptTotal(order)).toBe(1501.69);
      assertUnitAmountsMatchLineAmount(order);
    });

    it('receipt line amounts preserve kopecks for delivery', () => {
      const order = makeOrder({
        positions: [makePosition({ id: 1, itemId: 10, price: 4000 })],
        deliveryPrice: 234.56,
      });

      const { items } = buildAcquiringReceiptItems(order);
      const deliveryItem = items.find((item) => item.description === 'Доставка');

      expect(deliveryItem?.amount.value).toBe('234.56');
      expect(getAcquiringReceiptTotal(order)).toBe(getOrderPrice(order));
    });
  });

  describe('helpers', () => {
    it('G: getPositionsPrice includes goods and delivery', () => {
      const positions = [makePosition({ id: 1, itemId: 10, price: 4000, discountPrice: 500 })];
      expect(getPositionsPrice(positions, 300)).toBe(3800);
    });

    it('G: getPositionPrice multiplies unit net price by count', () => {
      const position = makePosition({ id: 1, itemId: 10, price: 2000, discountPrice: 500, count: 2 });
      expect(getPositionPrice(position)).toBe(3000);
    });

    it('G: getDiscountPercent returns 0 for buy two get one', () => {
      const positions = [makePosition({ id: 1, itemId: 10, price: 1000, count: 3 })];
      const promotional = makePromotional({ buyTwoGetOne: true });
      expect(getDiscountPercent(positions, 300, promotional)).toBe(0);
    });

    it('G: getDiscountPercent derives equivalent percent for fixed discount', () => {
      const positions = [makePosition({ id: 1, itemId: 10, price: 4000 })];
      const promotional = makePromotional({ discount: 1000 });
      expect(getDiscountPercent(positions, 300, promotional)).toBeCloseTo(23.26, 1);
    });

    it('G: getPositionPriceWithDiscount applies percent', () => {
      const position = makePosition({ id: 1, itemId: 10, price: 4000 });
      expect(getPositionPriceWithDiscount(position, 25)).toBe(3000);
    });
  });
});
