import { hasAnalyticsConsent } from '@shared/has-analytics-consent';
import { cookieConsentConfig } from '@shared/cookie-consent-config';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import type { ItemInterface } from '@/types/item/Item';
import type { OrderInterface } from '@/types/order/Order';

export const YANDEX_METRIKA_READY_EVENT_NAME = 'am-chokers-yandex-metrika-ready';

export const YANDEX_METRIKA_PURCHASE_GOAL_ID = 511960192;

interface EcommerceCartLineInterface {
  item: ItemInterface;
  count: number;
}

export interface PushEcommercePurchaseParametersInterface {
  order: OrderInterface;
  cartList: EcommerceCartLineInterface[];
  userLanguage: UserLangEnum;
}

type YandexMetrikaWindowExtension = Window & {
  dataLayer?: Record<string, unknown>[];
  amChokersYandexMetrikaReady?: boolean;
};

const pendingPurchases: PushEcommercePurchaseParametersInterface[] = [];

/**
 * Возвращает window с полями dataLayer и флагом готовности Метрики
 * @returns расширенный объект window
 */
const getEcommerceWindow = (): YandexMetrikaWindowExtension | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window as YandexMetrikaWindowExtension;
};

/**
 * Формирует payload purchase для dataLayer
 * @param parameters - заказ, строки корзины и язык пользователя
 * @returns объект ecommerce purchase
 */
const buildEcommercePurchasePayload = ({
  order,
  cartList,
  userLanguage,
}: PushEcommercePurchaseParametersInterface) => ({
  ecommerce: {
    currencyCode: 'RUB',
    purchase: {
      actionField: {
        id: order.id.toString(),
        coupon: order.promotional?.name,
        goal_id: YANDEX_METRIKA_PURCHASE_GOAL_ID,
        revenue: getOrderPrice(order) - order.deliveryPrice,
      },
      products: cartList.map(({ item, count }, index) => ({
        id: item.id.toString(),
        name: item.translations.find((translation) => translation.lang === userLanguage)?.name as string,
        price: item.price - item.discountPrice,
        discount: item.discountPrice,
        quantity: count,
        position: index + 1,
      })),
    },
  },
});

/**
 * Отправляет purchase в dataLayer
 * @param parameters - заказ, строки корзины и язык пользователя
 */
const pushPurchaseToDataLayer = (parameters: PushEcommercePurchaseParametersInterface): void => {
  const ecommerceWindow = getEcommerceWindow();
  if (!ecommerceWindow) {
    return;
  }

  ecommerceWindow.dataLayer = ecommerceWindow.dataLayer || [];
  ecommerceWindow.dataLayer.push(buildEcommercePurchasePayload(parameters));
};

/**
 * Сбрасывает очередь purchase и флаг готовности Метрики
 */
export const resetEcommercePurchaseQueue = (): void => {
  pendingPurchases.length = 0;

  const ecommerceWindow = getEcommerceWindow();
  if (ecommerceWindow) {
    ecommerceWindow.amChokersYandexMetrikaReady = false;
  }
};

/**
 * Отправляет отложенные purchase из очереди в dataLayer
 */
export const flushPendingEcommercePurchases = (): void => {
  if (!hasAnalyticsConsent()) {
    resetEcommercePurchaseQueue();
    return;
  }

  const ecommerceWindow = getEcommerceWindow();
  if (!ecommerceWindow?.amChokersYandexMetrikaReady) {
    return;
  }

  while (pendingPurchases.length > 0) {
    const nextPurchase = pendingPurchases.shift();
    if (nextPurchase) {
      pushPurchaseToDataLayer(nextPurchase);
    }
  }
};

/**
 * Отправляет purchase в Яндекс.Метрику ecommerce или ставит в очередь до init tag.js
 * @param parameters - заказ, строки корзины и язык пользователя
 */
export const pushEcommercePurchase = (parameters: PushEcommercePurchaseParametersInterface): void => {
  if (!hasAnalyticsConsent()) {
    return;
  }

  const ecommerceWindow = getEcommerceWindow();
  if (!ecommerceWindow) {
    return;
  }

  if (ecommerceWindow.amChokersYandexMetrikaReady) {
    pushPurchaseToDataLayer(parameters);
    return;
  }

  pendingPurchases.push(parameters);
};

if (typeof window !== 'undefined') {
  window.addEventListener(YANDEX_METRIKA_READY_EVENT_NAME, flushPendingEcommercePurchases);
  window.addEventListener(cookieConsentConfig.consentAcceptedEventName, flushPendingEcommercePurchases);
}
