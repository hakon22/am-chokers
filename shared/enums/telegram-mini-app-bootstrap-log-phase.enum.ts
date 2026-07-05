export enum TelegramMiniAppBootstrapLogPhaseEnum {
  /** Начало загрузки Bootstrap */
  BOOTSTRAP_START = 'BOOTSTRAP_START',
  /** Скрипт уже загружен */
  SCRIPT_REUSED = 'SCRIPT_REUSED',
  /** Запрос скрипта */
  SCRIPT_REQUEST = 'SCRIPT_REQUEST',
  /** Скрипт загружен */
  SCRIPT_ONLOAD = 'SCRIPT_ONLOAD',
  /** Ошибка загрузки скрипта */
  SCRIPT_ONERROR = 'SCRIPT_ONERROR',
  /** Таймаут загрузки скрипта */
  SCRIPT_TIMEOUT = 'SCRIPT_TIMEOUT',
  /** Аутентификация */
  AUTHENTICATING = 'AUTHENTICATING',
  /** Данные InitData успешно получены */
  INIT_DATA_RESOLVED = 'INIT_DATA_RESOLVED',
  /** Данные InitData пусты */
  INIT_DATA_EMPTY = 'INIT_DATA_EMPTY',
  /** Запрос аутентификации */
  AUTH_REQUEST = 'AUTH_REQUEST',
  /** Аутентификация успешна */
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  /** Аутентификация отклонена */
  AUTH_REJECTED = 'AUTH_REJECTED',
  /** Конец фазы Bootstrap */
  PHASE_FINAL = 'PHASE_FINAL',
}
