import { createContext } from 'react';

import { routes } from '@/routes';

/**
 * Пути навигации внутри Telegram Mini App для списков и карточек заказов
 */
export type TelegramOrderAppRoutesValue = {
  /** URL списка заказов пользователя */
  userOrdersListPath: string;
  /** URL карточки заказа пользователя */
  userOrderDetailPath: (orderId: number) => string;
  /** URL списка заказов в админке Mini App */
  adminOrdersListPath: string;
  /** URL карточки заказа в админке Mini App */
  adminOrderDetailPath: (orderId: number) => string;
};

export const telegramOrderAppRoutesMiniApp: TelegramOrderAppRoutesValue = {
  userOrdersListPath: routes.page.telegram.orders,
  userOrderDetailPath: (orderId) => routes.page.telegram.order(orderId),
  adminOrdersListPath: routes.page.telegram.adminOrders,
  adminOrderDetailPath: (orderId) => routes.page.telegram.adminOrder(orderId),
};

export const TelegramOrderAppRoutesContext = createContext<TelegramOrderAppRoutesValue | null>(null);
