import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';
import type { i18n as I18nInstance } from 'i18next';

import {
  getDefaultLanguageCode,
  languageConfig,
  parseLanguageCode,
  type LanguageCode,
} from '@shared/language-config';
import { ensureLanguageCookieFromStorage, resolveBootstrapLanguageCode } from '@/utilities/bootstrapLanguage';

import ru from './ru';
import en from './en';

const i18nInitOptions = {
  returnNull: false,
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
} as const;

export const resources = {
  ru,
  en,
};

/**
 * Читает язык из cookie в браузере
 * @returns код языка ru/en
 */
export const getLanguageFromDocumentCookie = (): LanguageCode | undefined => {
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
 * Начальный язык: cookie → localStorage → default
 * @returns код языка ru/en
 */
const getInitialLang = (): string => {
  if (typeof window === 'undefined') {
    return getDefaultLanguageCode();
  }

  ensureLanguageCookieFromStorage();
  return resolveBootstrapLanguageCode();
};

/**
 * Определяет язык приложения на клиенте (cookie → localStorage → default)
 * @returns код языка ru/en
 */
export const resolveClientLanguage = (): LanguageCode => resolveBootstrapLanguageCode();

const i18n = i18next.createInstance();

i18n
  .use(initReactI18next)
  .init({
    ...i18nInitOptions,
    lng: getInitialLang(),
    resources,
  });

const seoI18nByLanguage: Partial<Record<LanguageCode, I18nInstance>> = {};

/**
 * Возвращает кэшированный i18n для SEO/SSR по языку (без race на singleton)
 * @param languageCode - код языка ru/en
 * @returns экземпляр i18next с фиксированным языком
 */
export const getSeoI18n = (languageCode: LanguageCode): I18nInstance => {
  const cachedInstance = seoI18nByLanguage[languageCode];
  if (cachedInstance) {
    return cachedInstance;
  }

  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    ...i18nInitOptions,
    lng: languageCode,
    resources,
  });
  seoI18nByLanguage[languageCode] = instance;
  return instance;
};

/**
 * Создаёт экземпляр i18n с заданным языком (SSR)
 * @param initialLanguage - код языка ru/en
 * @returns настроенный экземпляр i18next
 */
export const createI18nInstance = async (initialLanguage: string) => {
  const instance = i18next.createInstance();

  await instance
    .use(initReactI18next)
    .init({
      ...i18nInitOptions,
      lng: initialLanguage,
      resources,
    });

  return instance;
};

export default i18n;
