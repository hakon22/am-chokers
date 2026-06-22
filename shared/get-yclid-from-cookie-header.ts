import _ from 'lodash';

import { yclidCookieConfig } from '@shared/yclid-cookie-config';

/**
 * Извлекает yclid из заголовка Cookie HTTP-запроса
 * @param cookieHeader - значение заголовка Cookie
 * @returns yclid или undefined, если cookie отсутствует
 */
export const getYclidFromCookieHeader = (cookieHeader: string | undefined): string | undefined => {
  if (!cookieHeader || _.isEmpty(cookieHeader)) {
    return undefined;
  }

  const cookiePairs = cookieHeader.split(';');

  for (const cookiePair of cookiePairs) {
    const trimmedPair = cookiePair.trim();
    const separatorIndex = trimmedPair.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = trimmedPair.slice(0, separatorIndex);
    const cookieValue = trimmedPair.slice(separatorIndex + 1);

    if (cookieName === yclidCookieConfig.cookieName && cookieValue) {
      return decodeURIComponent(cookieValue);
    }
  }

  return undefined;
};
