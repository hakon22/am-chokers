import _ from 'lodash';
import type { IItemWithoutData } from '@a2seven/yoo-checkout';

import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import {
  getOrderPrice,
  getPositionAmount,
  getPositionPrice,
  getPositionPriceAfterPromotional,
} from '@/utilities/order/getOrderPrice';
import type { OrderInterface } from '@/types/order/Order';
import type { OrderPositionEntity } from '@server/db/entities/order.position.entity';

export type AcquiringReceiptItemsResult = {
  items: IItemWithoutData[];
  amount: number;
};

/**
 * Формирует позиции чека ЮKassa для заказа.
 * @param order - заказ с позициями, доставкой и промокодом
 * @returns строки чека и итоговая сумма с учётом коррекции копеек
 */
export const buildAcquiringReceiptItems = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>): AcquiringReceiptItemsResult => {
  const amount = getOrderPrice(order);
  const buyTwoGetOneAmountByPosition = order.promotional?.buyTwoGetOne ? getPositionAmount(order) : undefined;

  const orderPositions = [...order.positions];

  if (order.deliveryPrice) {
    const deliveryPosition = {
      count: 1,
      price: order.deliveryPrice,
      discountPrice: 0,
      discount: 0,
      grade: { id: 0, grade: 0 },
      item: {
        translations: [
          { lang: UserLangEnum.RU, name: 'Доставка' },
          { lang: UserLangEnum.EN, name: 'Delivery' },
        ],
      },
    } as OrderPositionEntity;

    orderPositions.push(deliveryPosition);
  }

  const items = orderPositions.filter((position) => position.price).map((position) => {
    let lineTotal: number;
    if (buyTwoGetOneAmountByPosition && !_.isNil(position.id) && buyTwoGetOneAmountByPosition[position.id]) {
      lineTotal = buyTwoGetOneAmountByPosition[position.id];
    } else if (order.promotional?.buyTwoGetOne) {
      lineTotal = getPositionPrice(position);
    } else {
      lineTotal = getPositionPriceAfterPromotional(position, order);
    }
    return {
      description: position.item.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name,
      amount: {
        value: lineTotal.toString(),
        currency: 'RUB',
      },
      quantity: position.count.toString(),
      vat_code: 1,
      payment_subject: 'commodity',
      payment_mode: 'full_payment',
    };
  }) as IItemWithoutData[];

  const positionsAmount = items.reduce((acc, item) => acc + (+item.amount.value * 100), 0);
  const centAmount = amount * 100;

  if (centAmount !== positionsAmount && items.length) {
    const max = Math.max(centAmount, positionsAmount);
    const min = Math.min(centAmount, positionsAmount);
    const difference = max - min;

    if (centAmount > positionsAmount) {
      items[0].amount.value = (((+items[0].amount.value * 100) + difference) / 100).toFixed(2);
    } else {
      items[0].amount.value = (((+items[0].amount.value * 100) - difference) / 100).toFixed(2);
    }
  }

  return { items, amount };
};

/**
 * Суммирует строки чека в рублях.
 * @param order - заказ
 * @returns сумма всех строк чека
 */
export const getAcquiringReceiptTotal = (order: Omit<OrderInterface, 'error' | 'loadingStatus'>): number => {
  const { items } = buildAcquiringReceiptItems(order);
  return +items.reduce((acc, item) => acc + +item.amount.value, 0).toFixed(2);
};
