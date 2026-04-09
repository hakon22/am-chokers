import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';

import ru from './ru';
import en from './en';

export const resources = {
  ru,
  en,
};

const getInitialLang = (): string => {
  if (typeof window === 'undefined') return 'ru';
  const languageKey = process.env.NEXT_PUBLIC_LANGUAGE_KEY ?? '';
  return window.localStorage.getItem(languageKey) ?? 'ru';
};

i18next
  .use(initReactI18next)
  .init({
    returnNull: false,
    lng: getInitialLang(),
    resources,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
