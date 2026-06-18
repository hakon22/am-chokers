export type LanguageCode = 'ru' | 'en';

/**
 * Имя cookie и срок хранения языка интерфейса
 */
export const languageConfig = {
  cookieName: 'am-chokers-lang',
  cookieMaxAgeSeconds: 60 * 60 * 24 * 365,
} as const;

/**
 * Ключ localStorage для языка (переопределяется через NEXT_PUBLIC_LANGUAGE_KEY)
 * @returns ключ хранения языка
 */
export const getLanguageStorageKey = (): string =>
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_LANGUAGE_KEY?.trim()) || languageConfig.cookieName;

/**
 * Язык по умолчанию из env
 * @returns код языка ru/en
 */
export const getDefaultLanguageCode = (): LanguageCode =>
  process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE === 'en' ? 'en' : 'ru';

/**
 * Нормализует произвольное значение cookie/localStorage в ru/en
 * @param raw - сырое значение
 * @returns код языка или undefined
 */
export const parseLanguageCode = (raw: string | undefined | null): LanguageCode | undefined => {
  if (!raw) {
    return undefined;
  }

  const normalized = raw.trim().toLowerCase();

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  if (normalized === 'ru' || normalized.startsWith('ru-')) {
    return 'ru';
  }

  return undefined;
};
