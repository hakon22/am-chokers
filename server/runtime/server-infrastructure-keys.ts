import 'dotenv/config';

/**
 * Возвращает префикс ключей globalThis для инфраструктуры текущего приложения
 * @returns имя приложения из env или fallback am-chokers
 */
const getInfrastructureKeyPrefix = (): string => process.env.NEXT_PUBLIC_APP_NAME ?? 'am-chokers';

/**
 * Регистрирует Symbol.for с префиксом приложения
 * @param suffix - суффикс ключа (sharedDataSource, sharedRedisClient и т.д.)
 * @returns symbol для хранения на globalThis
 */
const createInfrastructureSymbol = (suffix: string): symbol => Symbol.for(`${getInfrastructureKeyPrefix()}.${suffix}`);

/** Ключ globalThis для общего DataSource TypeORM */
export const SHARED_DATA_SOURCE_KEY = createInfrastructureSymbol('sharedDataSource');

/** Ключ globalThis для основного Redis-клиента */
export const SHARED_REDIS_CLIENT_KEY = createInfrastructureSymbol('sharedRedisClient');

/** Ключ globalThis для Redis-клиента подписок */
export const SHARED_REDIS_SUBSCRIBE_CLIENT_KEY = createInfrastructureSymbol('sharedRedisSubscribeClient');

/** Ключ globalThis для состояния инициализации серверных сервисов */
export const SERVER_SERVICES_INIT_STATE_KEY = createInfrastructureSymbol('serverServicesInitState');
