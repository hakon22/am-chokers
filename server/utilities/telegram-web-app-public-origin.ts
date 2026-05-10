import _ from 'lodash';

import { serverHost } from '@/routes';

/**
 * Возвращает публичный origin (без завершающего слэша) для URL Mini App в Telegram.
 * Приоритет: `NEXT_PUBLIC_TELEGRAM_WEB_APP_ORIGIN` (например ngrok), иначе тот же базовый URL, что и `serverHost` в клиентских маршрутах (прод — `NEXT_PUBLIC_PRODUCTION_HOST`, локальная разработка — хост и порт из env).
 * @returns строка origin или пустая строка, если задать нельзя
 */
export const resolveTelegramWebAppPublicOrigin = (): string => {
  const explicitOrigin = (process.env.NEXT_PUBLIC_TELEGRAM_WEB_APP_ORIGIN ?? '').trim().replace(/\/$/, '');

  if (!_.isEmpty(explicitOrigin)) {
    return explicitOrigin;
  }

  return (serverHost ?? '').replace(/\/$/, '');
};
