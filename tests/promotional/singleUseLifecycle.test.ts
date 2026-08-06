import { describe, expect, it } from 'vitest';

import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import {
  getUnpaidOrdersToInvalidateSingleUsePromo,
  isSingleUsePromotionalConsumedForUser,
  PROMOTIONAL_RESPONSE_ALREADY_USED,
  type SingleUseOrderLifecycleStub,
} from '@shared/order/single-use-promotional';

const promoId = 7;

const makeLifecycleOrder = (
  params: Partial<SingleUseOrderLifecycleStub> & Pick<SingleUseOrderLifecycleStub, 'id' | 'userId'>,
): SingleUseOrderLifecycleStub => ({
  promotionalId: promoId,
  status: OrderStatusEnum.NOT_PAID,
  isPayment: false,
  ...params,
});

describe('singleUse lifecycle predicates', () => {
  it('Q1: user A paid with promo — consumed for A', () => {
    const orders = [
      makeLifecycleOrder({ id: 1, userId: 10, isPayment: true, status: OrderStatusEnum.NEW }),
    ];

    expect(isSingleUsePromotionalConsumedForUser(orders, 10, promoId)).toBe(true);
  });

  it('Q2: user B not consumed when only A paid', () => {
    const orders = [
      makeLifecycleOrder({ id: 1, userId: 10, isPayment: true, status: OrderStatusEnum.NEW }),
      makeLifecycleOrder({ id: 2, userId: 20 }),
    ];

    expect(isSingleUsePromotionalConsumedForUser(orders, 20, promoId)).toBe(false);
  });

  it('Q3: unpaid orders do not count as consumed', () => {
    const orders = [
      makeLifecycleOrder({ id: 1, userId: 10 }),
      makeLifecycleOrder({ id: 2, userId: 10 }),
    ];

    expect(isSingleUsePromotionalConsumedForUser(orders, 10, promoId)).toBe(false);
  });

  it('Q4: paid + unpaid — consumed and unpaid listed for invalidation', () => {
    const orders = [
      makeLifecycleOrder({ id: 1, userId: 10, isPayment: true, status: OrderStatusEnum.NEW }),
      makeLifecycleOrder({ id: 2, userId: 10 }),
    ];

    expect(isSingleUsePromotionalConsumedForUser(orders, 10, promoId)).toBe(true);
    expect(getUnpaidOrdersToInvalidateSingleUsePromo(orders, {
      id: 1,
      userId: 10,
      promotional: { id: promoId, singleUse: true },
    })).toEqual([orders[1]]);
  });

  it('Q5: excludeOrderId allows re-pay of same order', () => {
    const orders = [
      makeLifecycleOrder({ id: 1, userId: 10, isPayment: true, status: OrderStatusEnum.NEW }),
    ];

    expect(isSingleUsePromotionalConsumedForUser(orders, 10, promoId, 1)).toBe(false);
  });

  it('Q6: other user orders are not invalidated', () => {
    const orders = [
      makeLifecycleOrder({ id: 1, userId: 10, isPayment: true, status: OrderStatusEnum.NEW }),
      makeLifecycleOrder({ id: 2, userId: 20 }),
    ];

    expect(getUnpaidOrdersToInvalidateSingleUsePromo(orders, {
      id: 1,
      userId: 10,
      promotional: { id: promoId, singleUse: true },
    })).toEqual([]);
  });

  it('Q7: only NOT_PAID orders are invalidated', () => {
    const orders = [
      makeLifecycleOrder({ id: 1, userId: 10, isPayment: true, status: OrderStatusEnum.NEW }),
      makeLifecycleOrder({ id: 2, userId: 10 }),
      makeLifecycleOrder({ id: 3, userId: 10, status: OrderStatusEnum.CANCELED }),
    ];

    expect(getUnpaidOrdersToInvalidateSingleUsePromo(orders, {
      id: 1,
      userId: 10,
      promotional: { id: promoId, singleUse: true },
    }).map(({ id }) => id)).toEqual([2]);
  });
});

describe('singleUse API codes', () => {
  it('code 6 constant matches findByName already-used branch', () => {
    const orders = [makeLifecycleOrder({ id: 1, userId: 10, isPayment: true, status: OrderStatusEnum.NEW })];

    const shouldReturnCode6 = isSingleUsePromotionalConsumedForUser(orders, 10, promoId);

    expect(shouldReturnCode6).toBe(true);
    expect(PROMOTIONAL_RESPONSE_ALREADY_USED).toBe(6);
  });
});
