import _ from 'lodash';

/** Группа Telegram, которой в небоевом окружении разрешена реальная отправка сообщений ботом */
const DEV_OUTBOUND_ALLOWED_TELEGRAM_GROUP_CHAT_ID = '-4092491258';

/**
 * Нужно ли не вызывать внешние API для исходящих SMS и Telegram пользователям (и в общий чат через тот же бот).
 * Не-боевое окружение: не `production` или локальная база `DB=LOCAL` (в т.ч. `dev-prod` с `NODE_ENV=production`).
 * @returns true если реальную отправку следует пропустить
 */
export const isUserOutboundMessagingSkipped = (): boolean => {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return process.env.DB === 'LOCAL';
};

/**
 * Разрешена ли реальная отправка в Telegram в небоевом окружении (тестовая группа и админские чаты из env).
 * @param telegramChatId - идентификатор чата Telegram
 * @returns true если чат в allowlist и сообщение можно отправить через Bot API несмотря на skip outbound
 */
export const isTelegramDevOutboundAllowlistedChatId = (telegramChatId: string): boolean => {
  const normalizedChatId = telegramChatId.trim();

  if (normalizedChatId === DEV_OUTBOUND_ALLOWED_TELEGRAM_GROUP_CHAT_ID) {
    return true;
  }

  const adminTelegramChatIds = [process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_CHAT_ID2].filter(
    (adminTelegramChatId): adminTelegramChatId is string => !_.isNil(adminTelegramChatId) && adminTelegramChatId !== '',
  );

  return adminTelegramChatIds.some((adminTelegramChatId) => adminTelegramChatId.trim() === normalizedChatId);
};
