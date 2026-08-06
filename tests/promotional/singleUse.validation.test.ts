import { describe, expect, it } from 'vitest';
import moment from 'moment';

import { newPromotionalValidation } from '@/validations/validations';

const basePromotionalPayload = {
  name: 'PERSONAL',
  description: 'Personal promo',
  start: moment().subtract(1, 'day').toDate(),
  end: moment().add(1, 'month').toDate(),
  active: true,
};

describe('singleUse promotional validation', () => {
  it('L1: singleUse without users fails', async () => {
    await expect(newPromotionalValidation.serverValidator({
      ...basePromotionalPayload,
      singleUse: true,
      users: [],
      discount: 1000,
    })).rejects.toThrow();
  });

  it('L2: singleUse with users is valid', async () => {
    await expect(newPromotionalValidation.serverValidator({
      ...basePromotionalPayload,
      singleUse: true,
      users: [{ id: 1 }],
      discount: 1000,
    })).resolves.toBeDefined();
  });

  it('L3: singleUse false without users is valid', async () => {
    await expect(newPromotionalValidation.serverValidator({
      ...basePromotionalPayload,
      singleUse: false,
      users: [],
      discount: 1000,
    })).resolves.toBeDefined();
  });

  it('L4a: singleUse with fixed discount', async () => {
    await expect(newPromotionalValidation.serverValidator({
      ...basePromotionalPayload,
      singleUse: true,
      users: [{ id: 1 }],
      discount: 1000,
    })).resolves.toBeDefined();
  });

  it('L4b: singleUse with percent discount', async () => {
    await expect(newPromotionalValidation.serverValidator({
      ...basePromotionalPayload,
      singleUse: true,
      users: [{ id: 1 }],
      discountPercent: 25,
    })).resolves.toBeDefined();
  });

  it('L4c: singleUse with freeDelivery', async () => {
    await expect(newPromotionalValidation.serverValidator({
      ...basePromotionalPayload,
      singleUse: true,
      users: [{ id: 1 }],
      freeDelivery: true,
    })).resolves.toBeDefined();
  });

  it('L4d: singleUse with buyTwoGetOne', async () => {
    await expect(newPromotionalValidation.serverValidator({
      ...basePromotionalPayload,
      singleUse: true,
      users: [{ id: 1 }],
      buyTwoGetOne: true,
    })).resolves.toBeDefined();
  });
});
