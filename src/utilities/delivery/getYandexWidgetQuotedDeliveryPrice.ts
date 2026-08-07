import { isNil } from 'lodash';

import { DEFAULT_SHIPPING_RATE_RUB, clampYandexWidgetDeliveryPrice } from '@shared/delivery-config';

/**
 * Парсит цену в рублях из текста описания точки виджета
 * @param descriptionText - текст вида «Завтра · 225 руб» или «1 · 0 руб»
 * @returns цена или null, если разобрать не удалось / цена нулевая
 */
const parseDeliveryPriceFromWidgetDescription = (descriptionText: string | null | undefined): number | null => {
  if (!descriptionText) {
    return null;
  }

  const matchedPrice = descriptionText.match(/(\d+(?:[.,]\d+)?)\s*руб/i);
  if (!matchedPrice?.[1]) {
    return null;
  }

  const parsedPrice = parseFloat(matchedPrice[1].replace(',', '.'));
  if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    return null;
  }

  return parsedPrice;
};

/**
 * Достаёт расчётную стоимость доставки выбранного ПВЗ из виджета Яндекс
 * @param pointId - id пункта выдачи из события YaNddWidgetPointSelected
 * @param lastWidgetDeliveryPrice - последняя ненулевая цена из колбэка delivery_price
 * @returns цена в рублях, не ниже DEFAULT_SHIPPING_RATE_RUB
 */
export const getYandexWidgetQuotedDeliveryPrice = (pointId: string, lastWidgetDeliveryPrice: number | null): number => {
  const offer = window.YaDelivery?.pointOfferMap?.[pointId];
  const pricingTotal = offer?.pricing_total;

  if (!isNil(pricingTotal)) {
    const parsedPrice = parseFloat(String(pricingTotal));
    if (!Number.isNaN(parsedPrice) && parsedPrice > 0) {
      return clampYandexWidgetDeliveryPrice(parsedPrice);
    }
  }

  if (!isNil(lastWidgetDeliveryPrice) && lastWidgetDeliveryPrice > 0) {
    return clampYandexWidgetDeliveryPrice(lastWidgetDeliveryPrice);
  }

  const descriptionElement = document.querySelector(`.ydw-point-desc[data-pickpoint-id="${pointId}"]`);
  const priceFromDescription = parseDeliveryPriceFromWidgetDescription(descriptionElement?.textContent);
  if (!isNil(priceFromDescription)) {
    return clampYandexWidgetDeliveryPrice(priceFromDescription);
  }

  return DEFAULT_SHIPPING_RATE_RUB;
};
