import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { useContext, useEffect, useRef, useState } from 'react';

import mary from '@/images/mary.jpg';
import telegramIcon from '@/images/icons/telegram.svg';
import instagramIcon from '@/images/icons/instagram.svg';
import { MobileContext } from '@/components/Context';
import { Helmet } from '@/components/Helmet';
import { routes } from '@/routes';

const AboutBrand = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.aboutBrand' });

  const ref = useRef<HTMLDivElement>(null);

  const { isMobile } = useContext(MobileContext);

  const [width, setWidth] = useState(0);
  const [size, setSize] = useState({ width: mary.width, height: mary.height });

  useEffect(() => {
    const handleResize = () => {
      if (ref.current) {
        const clientWidth = ref.current.getBoundingClientRect().width;

        setWidth(Math.round(clientWidth));

        if (isMobile) {
          setSize({ width: clientWidth, height: clientWidth * 1.5 });
        } else {
          setSize({ width: mary.width, height: mary.height });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, ref]);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '100px' : '150px' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5">{t('title')}</h1>
      <div ref={ref} className="d-flex flex-column flex-xl-row row-gap-4 justify-content-between">
        <Image src={mary} width={size.width} height={size.height} unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} style={{ borderRadius: '15px' }} alt={t('title')} />
        <div className="d-flex flex-column" style={{ width: isMobile ? '100%' : `${97 - (size.width * 100 / width)}%` }}>
          <p>{t('1')}<span className="fw-bold">{t('2')}</span>{t('3')}<span className="fw-bold">{process.env.NEXT_PUBLIC_APP_NAME?.toUpperCase()}</span>{t('4')}</p>
          <p>{t('5')}</p>
          <p className="mb-5">{t('6')}</p>
          <div className="d-flex align-items-center justify-content-center gap-3">
            <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} title={t('telegram')} target="_blank">
              <Image src={telegramIcon} width="35" priority alt={t('telegram')} />
            </Link>
            <Link href={process.env.NEXT_PUBLIC_URL_INST_ACCOUNT ?? routes.page.base.homePage} className="instagram" title={t('instagram')} target="_blank">
              <Image src={instagramIcon} width="35" priority alt={t('instagram')} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutBrand;
