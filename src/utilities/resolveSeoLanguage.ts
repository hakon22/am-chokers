import { useTranslation } from 'react-i18next';

import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
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
 * Возвращает актуальный код языка для SEO meta и JSON-LD (следует за i18n после смены языка)
 * @returns код языка ru/en
 */
export const useSeoLanguage = (): LanguageCode => {
  const { i18n } = useTranslation();
  return resolveSeoLanguageCode(i18n.language);
};

/**
 * Возвращает актуальный UserLangEnum для выбора translation в SEO (следует за i18n после смены языка)
 * @returns язык пользователя для поля translation.lang
 */
export const useSeoUserLang = (): UserLangEnum => {
  const { i18n } = useTranslation();
  return resolveSeoUserLang(i18n.language);
};
