import { languageConfig, type LanguageCode } from '@shared/language-config';

/**
 * Записывает cookie языка интерфейса в браузере
 * @param languageCode - код языка ru/en
 */
export const setLanguageCookie = (languageCode: LanguageCode): void => {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${languageConfig.cookieName}=${languageCode}; path=/; max-age=${languageConfig.cookieMaxAgeSeconds}; SameSite=Lax`;
};
