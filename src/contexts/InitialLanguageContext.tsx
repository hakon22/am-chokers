import { createContext, useContext } from 'react';

import { getDefaultLanguageCode, parseLanguageCode, type LanguageCode } from '@shared/language-config';

const InitialLanguageContext = createContext<LanguageCode>(getDefaultLanguageCode());

/**
 * Возвращает язык запроса с SSR (cookie); не обновляется при клиентской смене языка.
 * Для SEO meta и JSON-LD на клиенте используйте useSeoLanguage из resolveSeoLanguage.
 * @returns код языка ru/en
 */
export const useInitialLanguage = (): LanguageCode => useContext(InitialLanguageContext);

export { InitialLanguageContext };

/**
 * Нормализует initialLanguage из getInitialProps в LanguageCode
 * @param initialLanguage - строка языка из _app
 * @returns код языка ru/en
 */
export const parseInitialLanguageCode = (initialLanguage: string): LanguageCode => (
  parseLanguageCode(initialLanguage) ?? getDefaultLanguageCode()
);
