import Link from 'next/link';
import CookieConsent from 'react-cookie-consent';
import { useTranslation } from 'react-i18next';

import { cookieConsentConfig } from '@shared/cookie-consent-config';
import { routes } from '@/routes';

/**
 * Баннер согласия на cookies и аналитику
 */
export const CookieConsentBanner = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'cookieConsent' });

  /**
   * Уведомляет подписчиков о принятии согласия
   */
  const handleAccept = (): void => {
    window.dispatchEvent(new CustomEvent(cookieConsentConfig.consentAcceptedEventName));
  };

  return (
    <CookieConsent
      location="bottom"
      containerClasses="justify-content-center text-center"
      style={{ zIndex: 1001, backgroundColor: '#2b3c5f' }}
      buttonStyle={{ backgroundColor: '#eaeef6', borderRadius: '7px', padding: '10px 20px' }}
      declineButtonStyle={{ backgroundColor: 'transparent', borderRadius: '7px', padding: '10px 20px', color: '#eaeef6' }}
      enableDeclineButton
      flipButtons
      cookieName={cookieConsentConfig.cookieName}
      cookieValue={cookieConsentConfig.acceptValue}
      declineCookieValue={cookieConsentConfig.declineValue}
      setDeclineCookie
      expires={365}
      buttonText={t('buttonText')}
      declineButtonText={t('decline')}
      onAccept={handleAccept}
    >
      <>
        {t('contentText')}
        <Link className="text-decoration-underline" href={routes.page.base.privacyPolicy}>{t('contentLink')}</Link>
      </>
    </CookieConsent>
  );
};
