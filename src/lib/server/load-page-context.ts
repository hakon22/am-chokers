import type { IncomingMessage } from 'http';

import { getRequestLanguageFromCookieHeader } from '@/lib/server/get-request-language';
import { isMobileDevice } from '@/utilities/isMobileDevice';
import type { LanguageCode } from '@shared/language-config';

export interface PageContextInterface {
  isMobile: boolean;
  initialLanguage: LanguageCode;
}

/**
 * Извлекает контекст страницы из HTTP-запроса для SSR shop-страниц
 * @param request - объект запроса Next.js (req)
 * @returns признак мобильного устройства и начальный язык
 */
export const loadPageContext = (request?: IncomingMessage): PageContextInterface => {
  const userAgent = request?.headers['user-agent'] ?? '';
  const isMobile = isMobileDevice(userAgent);
  const initialLanguage = getRequestLanguageFromCookieHeader(request?.headers.cookie);

  return {
    isMobile,
    initialLanguage,
  };
};
