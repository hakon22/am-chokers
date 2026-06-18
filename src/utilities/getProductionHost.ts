const DEFAULT_PRODUCTION_HOST = 'https://amchokers.ru';

/**
 * Возвращает абсолютный базовый URL сайта для canonical, OG и JSON-LD
 * @returns production host без завершающего слэша
 */
export const getProductionHost = (): string => {
  const configuredHost = process.env.NEXT_PUBLIC_PRODUCTION_HOST?.trim();

  if (configuredHost) {
    return configuredHost.replace(/\/$/, '');
  }

  return DEFAULT_PRODUCTION_HOST;
};
