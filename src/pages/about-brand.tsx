import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { useContext } from 'react';

import mary from '@/images/mary.jpg';
import telegramIcon from '@/images/icons/telegram.svg';
import instagramIcon from '@/images/icons/instagram.svg';
import { MobileContext } from '@/components/Context';
import { Helmet } from '@/components/Helmet';
import { routes } from '@/routes';

const AboutBrand = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.aboutBrand' });

  const { isMobile } = useContext(MobileContext);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '100px' : '150px' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5">{t('title')}</h1>
      <div className="d-flex flex-column flex-xl-row row-gap-4 justify-content-between">
        <Image src={mary} className="col-12 col-xl-4" unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} style={{ borderRadius: '15px' }} alt={t('title')} />
        <div className="d-flex flex-column" style={{ width: isMobile ? '100%' : '65%' }}>
          <p>{t('1')}<span className="fw-bold">{t('2')}</span>{t('3')}<span className="fw-bold">{process.env.NEXT_PUBLIC_APP_NAME?.toUpperCase()}</span>{t('4')}</p>
          <p>{t('5')}</p>
          <p className="mb-5">{t('6')}</p>
          <div className="d-flex align-items-center justify-content-center justify-content-xl-start gap-3">
            <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.homePage} title={t('telegram')} target="_blank">
              <Image src={telegramIcon} width="35" priority alt={t('telegram')} />
            </Link>
            <Link href={process.env.NEXT_PUBLIC_URL_INST_ACCOUNT ?? routes.homePage} className="instagram" title={t('instagram')} target="_blank">
              <Image src={instagramIcon} width="35" priority alt={t('instagram')} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutBrand;
