import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { LanguageCode } from '@shared/language-config';

/**
 * Преобразует код языка интерфейса в значение UserLangEnum для серверных сервисов
 * @param languageCode - код языка ru/en
 * @returns язык пользователя для TypeORM-сервисов
 */
export const mapLanguageCodeToUserLang = (languageCode: LanguageCode): UserLangEnum =>
  languageCode === 'en' ? UserLangEnum.EN : UserLangEnum.RU;
