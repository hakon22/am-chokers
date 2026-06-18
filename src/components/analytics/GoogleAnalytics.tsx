import { useEffect } from 'react';

import { cookieConsentConfig } from '@shared/cookie-consent-config';
import { hasAnalyticsConsent } from '@shared/has-analytics-consent';

const GOOGLE_ANALYTICS_MEASUREMENT_ID = 'G-P50BP1JPGM';
const GOOGLE_ANALYTICS_SCRIPT_URL = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;

type GoogleAnalyticsWindowExtension = {
  dataLayer?: unknown[];
  gtag?: (...parameters: unknown[]) => void;
  amChokersGoogleAnalyticsInitialized?: boolean;
};

/**
 * Возвращает window с полями Google Analytics
 * @returns расширенный объект window
 */
const getGoogleAnalyticsWindow = (): Window & GoogleAnalyticsWindowExtension => (
  window as Window & GoogleAnalyticsWindowExtension
);

/**
 * Подключает скрипт Google Analytics после согласия пользователя
 */
const injectGoogleAnalyticsScript = (): void => {
  const analyticsWindow = getGoogleAnalyticsWindow();

  if (analyticsWindow.amChokersGoogleAnalyticsInitialized || !hasAnalyticsConsent()) {
    return;
  }

  analyticsWindow.amChokersGoogleAnalyticsInitialized = true;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];

  analyticsWindow.gtag = function gtag(...parameters: unknown[]): void {
    analyticsWindow.dataLayer?.push(parameters);
  };

  analyticsWindow.gtag('js', new Date());
  analyticsWindow.gtag('config', GOOGLE_ANALYTICS_MEASUREMENT_ID);

  for (let scriptIndex = 0; scriptIndex < document.scripts.length; scriptIndex += 1) {
    if (document.scripts[scriptIndex].src === GOOGLE_ANALYTICS_SCRIPT_URL) {
      return;
    }
  }

  const scriptElement = document.createElement('script');
  const firstScript = document.getElementsByTagName('script')[0];
  scriptElement.async = true;
  scriptElement.src = GOOGLE_ANALYTICS_SCRIPT_URL;
  firstScript.parentNode?.insertBefore(scriptElement, firstScript);
};

/**
 * Компонент подключения Google Analytics с consent gate
 */
export const GoogleAnalytics = () => {
  useEffect(() => {
    injectGoogleAnalyticsScript();

    /**
     * Повторная инициализация после принятия баннера
     */
    const handleConsentAccepted = (): void => {
      injectGoogleAnalyticsScript();
    };

    window.addEventListener(cookieConsentConfig.consentAcceptedEventName, handleConsentAccepted);

    return () => {
      window.removeEventListener(cookieConsentConfig.consentAcceptedEventName, handleConsentAccepted);
    };
  }, []);

  return null;
};
