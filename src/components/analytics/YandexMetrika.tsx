/* eslint-disable @next/next/no-img-element */
import { useEffect } from 'react';

import { cookieConsentConfig } from '@shared/cookie-consent-config';
import { hasAnalyticsConsent } from '@shared/has-analytics-consent';

const YANDEX_METRIKA_COUNTER_ID = 100705426;
const YANDEX_METRIKA_SCRIPT_URL = `https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_COUNTER_ID}`;

interface YandexMetrikaQueueInterface {
  (...parameters: unknown[]): void;
  a?: unknown[];
  l?: number;
}

type YandexMetrikaWindowExtension = {
  ym?: YandexMetrikaQueueInterface;
  amChokersYandexMetrikaScriptLoaded?: boolean;
  amChokersYandexMetrikaFullModeEnabled?: boolean;
};

/**
 * Возвращает window с полями Яндекс.Метрики
 * @returns расширенный объект window
 */
const getYandexMetrikaWindow = (): Window & YandexMetrikaWindowExtension => (
  window as Window & YandexMetrikaWindowExtension
);

/**
 * Формирует параметры init счётчика в зависимости от согласия на расширенную аналитику
 * @param hasConsent - разрешены ли webvisor, карта кликов и отслеживание ссылок
 * @returns объект параметров для ym(..., 'init', ...)
 */
const getYandexMetrikaInitOptions = (hasConsent: boolean) => ({
  clickmap: hasConsent,
  trackLinks: hasConsent,
  accurateTrackBounce: hasConsent,
  webvisor: hasConsent,
  referrer: document.referrer,
  url: location.href,
});

/**
 * Вставляет tag.js и создаёт очередь ym, если скрипт ещё не подключён
 */
const loadYandexMetrikaScript = (): void => {
  const metrikaWindow = getYandexMetrikaWindow();

  if (metrikaWindow.amChokersYandexMetrikaScriptLoaded) {
    return;
  }

  metrikaWindow.amChokersYandexMetrikaScriptLoaded = true;

  const metrikaLoader = (
    targetWindow: Window & YandexMetrikaWindowExtension,
    documentObject: Document,
    scriptTag: string,
    scriptUrl: string,
    globalName: string,
  ): void => {
    const metrikaGlobal = targetWindow as Window & YandexMetrikaWindowExtension & Record<string, unknown>;
    const existingQueue = metrikaGlobal[globalName] as YandexMetrikaQueueInterface | undefined;

    metrikaGlobal[globalName] = existingQueue || function metrikaQueue(...queueParameters: unknown[]) {
      const queueTarget = metrikaGlobal[globalName] as YandexMetrikaQueueInterface;
      queueTarget.a = queueTarget.a || [];
      queueTarget.a.push(queueParameters);
    };

    const queueHolder = metrikaGlobal[globalName] as YandexMetrikaQueueInterface;
    queueHolder.a = queueHolder.a || [];
    queueHolder.l = Date.now();

    for (let scriptIndex = 0; scriptIndex < documentObject.scripts.length; scriptIndex += 1) {
      if (documentObject.scripts[scriptIndex].src === scriptUrl) {
        return;
      }
    }

    const scriptElement = documentObject.createElement('script');
    const firstScript = documentObject.getElementsByTagName(scriptTag)[0];
    scriptElement.async = true;
    scriptElement.src = scriptUrl;
    firstScript.parentNode?.insertBefore(scriptElement, firstScript);
  };

  metrikaLoader(metrikaWindow, document, 'script', YANDEX_METRIKA_SCRIPT_URL, 'ym');
};

/**
 * Инициализирует счётчик в минимальном режиме для атрибуции и офлайн-конверсий
 */
const initMinimalYandexMetrika = (): void => {
  loadYandexMetrikaScript();

  const metrikaWindow = getYandexMetrikaWindow();
  metrikaWindow.ym?.(YANDEX_METRIKA_COUNTER_ID, 'init', getYandexMetrikaInitOptions(false));
};

/**
 * Включает расширенные функции Метрики (webvisor, карта кликов) после согласия пользователя
 */
const enableFullYandexMetrika = (): void => {
  const metrikaWindow = getYandexMetrikaWindow();

  if (metrikaWindow.amChokersYandexMetrikaFullModeEnabled) {
    return;
  }

  loadYandexMetrikaScript();
  metrikaWindow.amChokersYandexMetrikaFullModeEnabled = true;
  metrikaWindow.ym?.(YANDEX_METRIKA_COUNTER_ID, 'init', getYandexMetrikaInitOptions(true));
};

/**
 * Подключает Метрику: минимальный режим всегда, полный — при наличии согласия
 */
const bootstrapYandexMetrika = (): void => {
  initMinimalYandexMetrika();

  if (hasAnalyticsConsent()) {
    enableFullYandexMetrika();
  }
};

/**
 * Компонент подключения Яндекс.Метрики: минимальный режим всегда, расширенный — по согласию
 */
export const YandexMetrika = () => {
  useEffect(() => {
    bootstrapYandexMetrika();

    /**
     * Включает полный режим Метрики после принятия баннера cookie
     */
    const handleConsentAccepted = (): void => {
      enableFullYandexMetrika();
    };

    window.addEventListener(cookieConsentConfig.consentAcceptedEventName, handleConsentAccepted);

    return () => {
      window.removeEventListener(cookieConsentConfig.consentAcceptedEventName, handleConsentAccepted);
    };
  }, []);

  return (
    <noscript>
      <div>
        <img
          src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_COUNTER_ID}`}
          style={{ position: 'absolute', left: '-9999px' }}
          alt=""
        />
      </div>
    </noscript>
  );
};
