import {
  getDefaultLanguageCode,
  getLanguageStorageKey,
  languageConfig,
  parseLanguageCode,
  type LanguageCode,
} from '@shared/language-config';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { setLanguageCookie } from '@/utilities/setLanguageCookie';
import { resolveSeoUserLang } from '@/utilities/resolveSeoLanguage';

/**
 * Читает язык из cookie в браузере
 * @returns код языка ru/en или undefined
 */
const getLanguageFromDocumentCookie = (): LanguageCode | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const cookieParts = document.cookie.split(';');

  for (const part of cookieParts) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name === languageConfig.cookieName) {
      const rawValue = decodeURIComponent(valueParts.join('='));
      return parseLanguageCode(rawValue);
    }
  }

  return undefined;
};

/**
 * Записывает cookie языка из localStorage, если cookie ещё нет
 */
export const ensureLanguageCookieFromStorage = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const cookieLanguage = getLanguageFromDocumentCookie();
  if (cookieLanguage) {
    return;
  }

  const storedLanguage = window.localStorage.getItem(getLanguageStorageKey());
  const parsedLanguage = parseLanguageCode(storedLanguage);
  if (parsedLanguage) {
    setLanguageCookie(parsedLanguage);
  }
};

/**
 * Определяет язык до первого рендера React: cookie → localStorage → default
 * @returns код языка ru/en
 */
export const resolveBootstrapLanguageCode = (): LanguageCode => {
  if (typeof window === 'undefined') {
    return getDefaultLanguageCode();
  }

  ensureLanguageCookieFromStorage();

  const cookieLanguage = getLanguageFromDocumentCookie();
  if (cookieLanguage) {
    return cookieLanguage;
  }

  const storedLanguage = window.localStorage.getItem(getLanguageStorageKey());
  return parseLanguageCode(storedLanguage) ?? getDefaultLanguageCode();
};

/**
 * UserLangEnum для preloadedState Redux до первого рендера
 * @returns язык пользователя для поля translation.lang
 */
export const resolveBootstrapUserLang = (): UserLangEnum => (
  resolveSeoUserLang(resolveBootstrapLanguageCode())
);
