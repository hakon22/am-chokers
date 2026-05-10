import { type JSX, type ReactNode } from 'react';

import { useAuthHandler } from '@/hooks/useAuthHandler';

/**
 * Вешает хук сессии сайта на маршруты Mini App: axios, refresh, загрузка заказов и корзины (основной Layout этого не делает).
 * @param children - вложенный bootstrap и страница
 */
export const TelegramMiniAppAuthBridge = ({ children }: { children: ReactNode; }): JSX.Element => {
  useAuthHandler();
  return <>{children}</>;
};
