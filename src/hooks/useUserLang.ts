import { useInitialLanguage } from '@/contexts/InitialLanguageContext';
import { useAppSelector } from '@/hooks/reduxHooks';
import { resolveSeoUserLang } from '@/utilities/resolveSeoLanguage';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

/**
 * Возвращает актуальный язык для переводов из БД и UI
 * @returns язык пользователя для поля translation.lang
 */
export const useUserLang = (): UserLangEnum => {
  const reduxLang = useAppSelector((state) => state.user.lang);
  const initialLanguageCode = useInitialLanguage();
  return reduxLang ?? resolveSeoUserLang(initialLanguageCode);
};
