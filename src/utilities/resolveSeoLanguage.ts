import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { useUserLang } from '@/hooks/useUserLang';
import type { LanguageCode } from '@shared/language-config';

/**
 * Преобразует код i18n в UserLangEnum для выбора translation в SEO
 * @param i18nLanguage - значение i18n.language или initialLanguage
 * @returns язык пользователя для поля translation.lang
 */
export const resolveSeoUserLang = (i18nLanguage: string): UserLangEnum => (
  i18nLanguage === 'en' ? UserLangEnum.EN : UserLangEnum.RU
);

/**
 * Преобразует код i18n в LanguageCode для JSON-LD и meta
 * @param i18nLanguage - значение i18n.language или initialLanguage
 * @returns код языка ru/en
 */
export const resolveSeoLanguageCode = (i18nLanguage: string): LanguageCode => (
  i18nLanguage === 'en' ? 'en' : 'ru'
);

/**
 * Возвращает актуальный код языка для SEO meta и JSON-LD
 * @returns код языка ru/en
 */
export const useSeoLanguage = (): LanguageCode => {
  const userLang = useUserLang();
  return userLang === UserLangEnum.EN ? 'en' : 'ru';
};

/**
 * Возвращает актуальный UserLangEnum для выбора translation в SEO
 * @returns язык пользователя для поля translation.lang
 */
export const useSeoUserLang = (): UserLangEnum => useUserLang();
