import axios from 'axios';

import { routes } from '@/routes';
import type { TelegramMiniAppBootstrapLogEvent } from '@shared/telegram-mini-app-bootstrap-log-event';

type TelegramMiniAppBootstrapLogPayload = Omit<TelegramMiniAppBootstrapLogEvent, 'loadAttempt' | 'elapsedMilliseconds'>;

/**
 * Отправляет диагностическое событие bootstrap Mini App на сервер (ошибки сети игнорируются)
 * @param event - метаданные события без чувствительных данных
 */
export const logTelegramMiniAppBootstrap = (event: TelegramMiniAppBootstrapLogEvent): void => {
  void axios.post(routes.integration.telegram.bootstrapLog, event).catch(() => {
    // bootstrap не должен ломаться из-за диагностики
  });
};

/**
 * Создаёт функцию логирования с общим таймером и номером попытки загрузки скрипта
 * @param loadAttempt - номер попытки загрузки SDK (0 — первая)
 * @returns функция отправки события с автоматическим elapsedMilliseconds
 */
export const createTelegramMiniAppBootstrapLogger = (loadAttempt: number) => {
  const startedAtMilliseconds = performance.now();

  /**
   * Отправляет событие bootstrap с elapsedMilliseconds и loadAttempt
   * @param event - поля события без таймера и номера попытки
   */
  const logBootstrapEvent = (event: TelegramMiniAppBootstrapLogPayload): void => {
    logTelegramMiniAppBootstrap({
      ...event,
      loadAttempt,
      elapsedMilliseconds: Math.round(performance.now() - startedAtMilliseconds),
    });
  };

  return logBootstrapEvent;
};
