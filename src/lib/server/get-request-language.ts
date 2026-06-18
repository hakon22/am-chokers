import { getDefaultLanguageCode, languageConfig, parseLanguageCode, type LanguageCode } from '@shared/language-config';

/**
 * Парсит значение cookie языка из заголовка Cookie (Pages Router SSR)
 * @param cookieHeader - значение req.headers.cookie
 * @returns код языка ru/en
 */
export const getRequestLanguageFromCookieHeader = (cookieHeader: string | undefined): LanguageCode => {
  if (!cookieHeader) {
    return getDefaultLanguageCode();
  }

  const cookieParts = cookieHeader.split(';');

  for (const part of cookieParts) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name === languageConfig.cookieName) {
      const rawValue = decodeURIComponent(valueParts.join('='));
      return parseLanguageCode(rawValue) ?? getDefaultLanguageCode();
    }
  }

  return getDefaultLanguageCode();
};
