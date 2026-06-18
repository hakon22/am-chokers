import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Синхронизирует document.documentElement.lang после смены языка на клиенте
 */
export const HtmlLangSync = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const languageCode = i18n.language === 'en' ? 'en' : 'ru';
    document.documentElement.lang = languageCode;
  }, [i18n.language]);

  return null;
};
