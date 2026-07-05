import { isEmpty } from 'lodash';

const TELEGRAM_LAUNCH_PARAM_PREFIX = 'tgWebApp';

const TELEGRAM_WEB_APP_INIT_DATA_SESSION_STORAGE_KEY = 'telegram_web_app_init_data';

/**
 * Извлекает сырую строку initData из hash launch-параметров Telegram
 * @param locationHash - значение window.location.hash (с ведущим # или без)
 * @returns строка initData в формате query string или пустая строка
 */
export const parseTelegramWebAppInitDataFromLocationHash = (locationHash: string): string => {
  const hashBody = locationHash.startsWith('#') ? locationHash.slice(1) : locationHash;

  if (isEmpty(hashBody)) {
    return '';
  }

  const searchParameters = new URLSearchParams(hashBody);
  const initDataEntries: string[] = [];

  searchParameters.forEach((value, key) => {
    if (!key.startsWith(TELEGRAM_LAUNCH_PARAM_PREFIX)) {
      initDataEntries.push(`${key}=${value}`);
    }
  });

  if (initDataEntries.some((entry) => entry.startsWith('hash='))) {
    return initDataEntries.join('&');
  }

  const tgWebAppDataPrefix = 'tgWebAppData=';
  const dataIndex = hashBody.indexOf(tgWebAppDataPrefix);

  if (dataIndex === -1) {
    return '';
  }

  const remainder = hashBody.slice(dataIndex + tgWebAppDataPrefix.length);
  const nextLaunchParameterMatch = remainder.match(/&tgWebApp[A-Za-z]/);
  const embeddedInitData = nextLaunchParameterMatch?.index === undefined
    ? remainder
    : remainder.slice(0, nextLaunchParameterMatch.index);

  return embeddedInitData;
};

/**
 * Проверяет, что hash содержит признаки запуска из Telegram Mini App
 * @param locationHash - значение window.location.hash
 * @returns true, если в hash есть launch-параметры Telegram
 */
export const hasTelegramWebAppLaunchParametersInHash = (locationHash: string): boolean => {
  const hashBody = locationHash.startsWith('#') ? locationHash.slice(1) : locationHash;

  if (isEmpty(hashBody)) {
    return false;
  }

  const searchParameters = new URLSearchParams(hashBody);

  return searchParameters.has('tgWebAppVersion')
    || searchParameters.has('tgWebAppPlatform')
    || searchParameters.has('tgWebAppData')
    || hashBody.includes(`${TELEGRAM_LAUNCH_PARAM_PREFIX}`);
};

/**
 * Сохраняет initData в sessionStorage для повторного использования после client-side навигации
 * @param initData - сырая строка initData
 */
export const persistTelegramWebAppInitData = (initData: string): void => {
  if (isEmpty(initData) || typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(TELEGRAM_WEB_APP_INIT_DATA_SESSION_STORAGE_KEY, initData);
  } catch {
    // sessionStorage может быть недоступен
  }
};

/**
 * Читает ранее сохранённый initData из sessionStorage
 * @returns строка initData или пустая строка
 */
export const readPersistedTelegramWebAppInitData = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return window.sessionStorage.getItem(TELEGRAM_WEB_APP_INIT_DATA_SESSION_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

/**
 * Возвращает initData из WebApp SDK, hash URL или sessionStorage
 * @param telegramWebAppInitData - значение window.Telegram.WebApp.initData, если SDK доступен
 * @param locationHash - значение window.location.hash
 * @returns строка initData или пустая строка
 */
export const resolveTelegramWebAppInitData = (
  telegramWebAppInitData: string | undefined,
  locationHash: string,
): string => {
  if (!isEmpty(telegramWebAppInitData)) {
    return telegramWebAppInitData ?? '';
  }

  const initDataFromHash = parseTelegramWebAppInitDataFromLocationHash(locationHash);

  if (!isEmpty(initDataFromHash)) {
    return initDataFromHash;
  }

  return readPersistedTelegramWebAppInitData();
};

/**
 * Ожидает появления initData с короткими повторными попытками
 * @param readInitData - функция чтения текущего initData
 * @param attemptCount - число попыток
 * @param delayMilliseconds - пауза между попытками в миллисекундах
 * @returns найденный initData или пустая строка
 */
export const waitForTelegramWebAppInitData = async (
  readInitData: () => string,
  attemptCount = 3,
  delayMilliseconds = 100,
): Promise<string> => {
  for (let attemptIndex = 0; attemptIndex < attemptCount; attemptIndex += 1) {
    const initData = readInitData();

    if (!isEmpty(initData)) {
      return initData;
    }

    if (attemptIndex < attemptCount - 1) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, delayMilliseconds);
      });
    }
  }

  return '';
};
