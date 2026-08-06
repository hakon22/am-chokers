import { describe, expect, it } from 'vitest';

import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { DEFAULT_SHIPPING_RATE_RUB, PRICE_FOR_FREE_DELIVERY_RUB } from '@shared/delivery-config';
import { restoreDeliveryPriceWithoutPromotional } from '@shared/order/single-use-promotional';

import { makePromotional } from '@tests/promotional/singleUse.fixtures';

describe('restoreDeliveryPriceWithoutPromotional', () => {
  it('M1: pickup with freeDelivery stays 0', () => {
    const price = restoreDeliveryPriceWithoutPromotional(
      0,
      DeliveryTypeEnum.PICKUP,
      makePromotional({ freeDelivery: true }),
    );

    expect(price).toBe(0);
  });

  it('M2: widget delivery with freeDelivery restores default rate', () => {
    const price = restoreDeliveryPriceWithoutPromotional(
      0,
      DeliveryTypeEnum.YANDEX_DELIVERY,
      makePromotional({ freeDelivery: true }),
    );

    expect(price).toBe(DEFAULT_SHIPPING_RATE_RUB);
  });

  it('M3: existing delivery price is preserved', () => {
    const price = restoreDeliveryPriceWithoutPromotional(
      234.56,
      DeliveryTypeEnum.CDEK,
      makePromotional({ freeDelivery: true }),
    );

    expect(price).toBe(234.56);
  });

  it('M4: non-freeDelivery promo does not restore delivery', () => {
    const price = restoreDeliveryPriceWithoutPromotional(
      0,
      DeliveryTypeEnum.YANDEX_DELIVERY,
      makePromotional({ discount: 1000 }),
    );

    expect(price).toBe(0);
  });

  it('M5: restores quoted delivery above default rate', () => {
    const price = restoreDeliveryPriceWithoutPromotional(
      0,
      DeliveryTypeEnum.CDEK,
      makePromotional({ freeDelivery: true }),
      450,
      4000,
    );

    expect(price).toBe(450);
  });

  it('M6: goods from 10000 keep free delivery after strip', () => {
    const price = restoreDeliveryPriceWithoutPromotional(
      0,
      DeliveryTypeEnum.YANDEX_DELIVERY,
      makePromotional({ freeDelivery: true }),
      450,
      PRICE_FOR_FREE_DELIVERY_RUB,
    );

    expect(price).toBe(0);
  });

  it('M7: threshold overrides quoted delivery price', () => {
    const price = restoreDeliveryPriceWithoutPromotional(
      0,
      DeliveryTypeEnum.CDEK,
      makePromotional({ freeDelivery: true }),
      450,
      12000,
    );

    expect(price).toBe(0);
  });
});
