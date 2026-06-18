/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';

import { cookieConsentConfig } from '@shared/cookie-consent-config';
import { hasAnalyticsConsent } from '@shared/has-analytics-consent';
import { flushPendingEcommercePurchases, resetEcommercePurchaseQueue, YANDEX_METRIKA_READY_EVENT_NAME } from '@/utilities/analytics/ecommerce';

const YANDEX_METRIKA_COUNTER_ID = 100705426;
const YANDEX_METRIKA_SCRIPT_URL = `https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_COUNTER_ID}`;

interface YandexMetrikaQueueInterface {
  (...parameters: unknown[]): void;
  a?: unknown[];
  l?: number;
}

type YandexMetrikaWindowExtension = {
  ym?: YandexMetrikaQueueInterface;
  dataLayer?: unknown[];
  amChokersYandexMetrikaInitialized?: boolean;
  amChokersYandexMetrikaReady?: boolean;
};

/**
 * Возвращает window с полями Яндекс.Метрики
 * @returns расширенный объект window
 */
const getYandexMetrikaWindow = (): Window & YandexMetrikaWindowExtension => (
  window as Window & YandexMetrikaWindowExtension
);

/**
 * Подключает скрипт Яндекс.Метрики после согласия пользователя
 */
const injectYandexMetrikaScript = (): void => {
  const metrikaWindow = getYandexMetrikaWindow();

  if (metrikaWindow.amChokersYandexMetrikaInitialized || !hasAnalyticsConsent()) {
    return;
  }

  metrikaWindow.amChokersYandexMetrikaInitialized = true;
  metrikaWindow.dataLayer = metrikaWindow.dataLayer || [];

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
        targetWindow.amChokersYandexMetrikaReady = true;
        window.dispatchEvent(new Event(YANDEX_METRIKA_READY_EVENT_NAME));
        flushPendingEcommercePurchases();
        return;
      }
    }

    const scriptElement = documentObject.createElement('script');
    const firstScript = documentObject.getElementsByTagName(scriptTag)[0];
    scriptElement.async = true;
    scriptElement.src = scriptUrl;
    scriptElement.onload = () => {
      targetWindow.amChokersYandexMetrikaReady = true;
      window.dispatchEvent(new Event(YANDEX_METRIKA_READY_EVENT_NAME));
      flushPendingEcommercePurchases();
    };
    firstScript.parentNode?.insertBefore(scriptElement, firstScript);
  };

  metrikaLoader(metrikaWindow, document, 'script', YANDEX_METRIKA_SCRIPT_URL, 'ym');

  metrikaWindow.ym?.(YANDEX_METRIKA_COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
  });
};

/**
 * Компонент подключения Яндекс.Метрики с consent gate
 */
export const YandexMetrika = () => {
  const [isConsentGranted, setIsConsentGranted] = useState(false);

  useEffect(() => {
    /**
     * Синхронизирует флаг согласия с cookie
     */
    const syncConsentState = (): void => {
      const isGranted = hasAnalyticsConsent();
      if (!isGranted) {
        resetEcommercePurchaseQueue();
      }
      setIsConsentGranted(isGranted);
    };

    injectYandexMetrikaScript();
    syncConsentState();

    /**
     * Повторная инициализация после принятия баннера
     */
    const handleConsentAccepted = (): void => {
      injectYandexMetrikaScript();
      syncConsentState();
    };

    window.addEventListener(cookieConsentConfig.consentAcceptedEventName, handleConsentAccepted);

    return () => {
      window.removeEventListener(cookieConsentConfig.consentAcceptedEventName, handleConsentAccepted);
      resetEcommercePurchaseQueue();
    };
  }, []);

  if (!isConsentGranted) {
    return null;
  }

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
