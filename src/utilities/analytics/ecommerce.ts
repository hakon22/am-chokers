import { hasAnalyticsConsent } from '@shared/has-analytics-consent';
import { cookieConsentConfig } from '@shared/cookie-consent-config';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import type { CartItemInterface } from '@/types/cart/Cart';
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

export interface PushEcommerceAddToCartParametersInterface {
  cartItem: CartItemInterface;
  userLanguage: UserLangEnum;
  quantityAdded: number;
}

type PendingEcommerceEvent =
  | { type: 'purchase'; parameters: PushEcommercePurchaseParametersInterface }
  | { type: 'add'; parameters: PushEcommerceAddToCartParametersInterface };

type YandexMetrikaWindowExtension = Window & {
  dataLayer?: Record<string, unknown>[];
  amChokersYandexMetrikaReady?: boolean;
};

const pendingEcommerceEvents: PendingEcommerceEvent[] = [];

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
 * Возвращает название товара на языке пользователя
 * @param item - товар из корзины или заказа
 * @param userLanguage - язык пользователя
 * @returns локализованное название
 */
const getItemNameForLanguage = (item: ItemInterface, userLanguage: UserLangEnum): string => (
  item.translations.find((translation) => translation.lang === userLanguage)?.name as string
);

/**
 * Формирует payload purchase для dataLayer
 * @param parameters - заказ, строки корзины и язык пользователя
 * @returns объект ecommerce purchase
 */
const buildEcommercePurchasePayload = ({ order, cartList, userLanguage }: PushEcommercePurchaseParametersInterface) => ({
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
        name: getItemNameForLanguage(item, userLanguage),
        price: item.price - item.discountPrice,
        discount: item.discountPrice,
        quantity: count,
        position: index + 1,
      })),
    },
  },
});

/**
 * Формирует payload add для dataLayer
 * @param parameters - позиция корзины, язык пользователя и добавленное количество
 * @returns объект ecommerce add
 */
const buildEcommerceAddToCartPayload = ({ cartItem, userLanguage, quantityAdded }: PushEcommerceAddToCartParametersInterface) => ({
  ecommerce: {
    currencyCode: 'RUB',
    add: {
      products: [{
        id: cartItem.item.id.toString(),
        name: getItemNameForLanguage(cartItem.item, userLanguage),
        price: cartItem.item.price - cartItem.item.discountPrice,
        discount: cartItem.item.discountPrice,
        quantity: quantityAdded,
      }],
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
 * Отправляет add в dataLayer
 * @param parameters - позиция корзины, язык пользователя и добавленное количество
 */
const pushAddToCartToDataLayer = (parameters: PushEcommerceAddToCartParametersInterface): void => {
  const ecommerceWindow = getEcommerceWindow();
  if (!ecommerceWindow) {
    return;
  }

  ecommerceWindow.dataLayer = ecommerceWindow.dataLayer || [];
  ecommerceWindow.dataLayer.push(buildEcommerceAddToCartPayload(parameters));
};

/**
 * Отправляет отложенное ecommerce-событие в dataLayer
 * @param event - тип события и параметры
 */
const pushPendingEcommerceEvent = (event: PendingEcommerceEvent): void => {
  if (event.type === 'purchase') {
    pushPurchaseToDataLayer(event.parameters);
    return;
  }

  pushAddToCartToDataLayer(event.parameters);
};

/**
 * Сбрасывает очередь ecommerce-событий и флаг готовности Метрики
 */
export const resetEcommercePurchaseQueue = (): void => {
  pendingEcommerceEvents.length = 0;

  const ecommerceWindow = getEcommerceWindow();
  if (ecommerceWindow) {
    ecommerceWindow.amChokersYandexMetrikaReady = false;
  }
};

/**
 * Отправляет отложенные ecommerce-события из очереди в dataLayer
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

  while (pendingEcommerceEvents.length > 0) {
    const nextEvent = pendingEcommerceEvents.shift();
    if (nextEvent) {
      pushPendingEcommerceEvent(nextEvent);
    }
  }
};

/**
 * Ставит ecommerce-событие в очередь или отправляет сразу, если Метрика готова
 * @param event - тип события и параметры
 */
const enqueueOrPushEcommerceEvent = (event: PendingEcommerceEvent): void => {
  if (!hasAnalyticsConsent()) {
    return;
  }

  const ecommerceWindow = getEcommerceWindow();
  if (!ecommerceWindow) {
    return;
  }

  if (ecommerceWindow.amChokersYandexMetrikaReady) {
    pushPendingEcommerceEvent(event);
    return;
  }

  pendingEcommerceEvents.push(event);
};

/**
 * Отправляет purchase в Яндекс.Метрику ecommerce или ставит в очередь до init tag.js
 * @param parameters - заказ, строки корзины и язык пользователя
 */
export const pushEcommercePurchase = (parameters: PushEcommercePurchaseParametersInterface): void => {
  enqueueOrPushEcommerceEvent({ type: 'purchase', parameters });
};

/**
 * Отправляет add в Яндекс.Метрику ecommerce или ставит в очередь до init tag.js
 * @param parameters - позиция корзины, язык пользователя и добавленное количество
 */
export const pushEcommerceAddToCart = (parameters: PushEcommerceAddToCartParametersInterface): void => {
  enqueueOrPushEcommerceEvent({ type: 'add', parameters });
};

if (typeof window !== 'undefined') {
  window.addEventListener(YANDEX_METRIKA_READY_EVENT_NAME, flushPendingEcommercePurchases);
  window.addEventListener(cookieConsentConfig.consentAcceptedEventName, flushPendingEcommercePurchases);
}
