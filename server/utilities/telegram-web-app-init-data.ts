import crypto from 'crypto';

import _ from 'lodash';

const MAX_AUTH_DATE_AGE_SECONDS = 86400;

/**
 * Проверяет подпись строки initData от Telegram Web App и извлекает id пользователя Telegram
 * @param initData - сырая строка `window.Telegram.WebApp.initData`
 * @param botToken - токен бота (`TELEGRAM_TOKEN`)
 * @returns id пользователя в Telegram в виде строки или `null`, если подпись неверна или данные неполные
 */
export const verifyTelegramWebAppInitDataAndGetTelegramUserId = (initData: string, botToken: string): string | null => {
  if (_.isNil(initData) || initData.trim() === '' || _.isNil(botToken) || botToken === '') {
    return null;
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');

  if (_.isNil(receivedHash)) {
    return null;
  }

  params.delete('hash');
  const sortedKeys = [...params.keys()].sort((firstKey, secondKey) => firstKey.localeCompare(secondKey));
  const dataCheckString = sortedKeys
    .map((parameterKey) => {
      const parameterValue = params.get(parameterKey);
      return `${parameterKey}=${parameterValue ?? ''}`;
    })
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (calculatedHash !== receivedHash) {
    return null;
  }

  const authDateRaw = params.get('auth_date');

  if (_.isNil(authDateRaw)) {
    return null;
  }

  const authDateSeconds = Number.parseInt(authDateRaw, 10);

  if (Number.isNaN(authDateSeconds)) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (nowSeconds - authDateSeconds > MAX_AUTH_DATE_AGE_SECONDS) {
    return null;
  }

  const userJson = params.get('user');

  if (_.isNil(userJson)) {
    return null;
  }

  let telegramUserObject: { id?: number; };

  try {
    telegramUserObject = JSON.parse(userJson) as { id?: number; };
  } catch {
    return null;
  }

  if (_.isNil(telegramUserObject.id)) {
    return null;
  }

  return String(telegramUserObject.id);
};
