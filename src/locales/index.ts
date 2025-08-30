import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';

import ru from './ru';
import en from './en';

export const resources = {
  ru,
  en,
};

i18next
  .use(initReactI18next)
  .init({
    returnNull: false,
    lng: 'ru',
    resources,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
