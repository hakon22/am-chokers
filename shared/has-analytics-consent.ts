import { cookieConsentConfig } from '@shared/cookie-consent-config';

/**
 * Проверяет, дано ли согласие на аналитические cookies
 * @returns true, если cookie согласия установлена в acceptValue
 */
export const hasAnalyticsConsent = (): boolean => {
  if (typeof document === 'undefined') {
    return false;
  }

  const cookiePattern = new RegExp(`(?:^|; )${cookieConsentConfig.cookieName}=([^;]*)`);
  const cookieMatch = document.cookie.match(cookiePattern);

  return cookieMatch?.[1] === cookieConsentConfig.acceptValue;
};
