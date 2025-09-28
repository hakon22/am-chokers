import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import Link from 'next/link';

import { Helmet } from '@/components/Helmet';
import { MobileContext } from '@/components/Context';
import { routes } from '@/routes';

const Delivery = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.delivery' });

  const { isMobile } = useContext(MobileContext);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '100px' : '150px' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5">{t('title')}</h1>
      <div className="d-flex flex-column">
        <p>{t('1')}</p>
        <p>{t('2')}</p>
        <p>{t('3')}</p>
        <p>{t('4')}</p>
        <p>
          {t('5')}
          <Link href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_MAIL}`} target="_blank" className="fw-bold">{process.env.NEXT_PUBLIC_CONTACT_MAIL}</Link>
          {t('6')}
          <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank" className="fw-bold">@KS_Mary</Link>
          {t('7')}
        </p>
        <p>{t('8')}</p>
        <p>{t('9')}</p>
        <p className="my-4 fs-5 fw-bold text-uppercase">{t('10')}</p>
        <p>{t('11')}</p>
        <p>{t('12')}</p>
      </div>
    </div>
  );
};

export default Delivery;
