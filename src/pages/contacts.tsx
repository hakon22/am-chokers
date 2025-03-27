import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { useContext } from 'react';

import telegramIcon from '@/images/icons/telegram.svg';
import instagramIcon from '@/images/icons/instagram.svg';
import { Helmet } from '@/components/Helmet';
import { routes } from '@/routes';
import { MobileContext } from '@/components/Context';

const Contacts = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.contacts' });

  const { isMobile } = useContext(MobileContext);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '100px' : '12%' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5">{t('title')}</h1>
      <div className="d-flex flex-column text-center text-xl-start">
        <p>{t('1')}</p>
        <p className="mb-5">{t('2')}<a className="fw-bold" href={`tel:${process.env.NEXT_PUBLIC_WORK_PHONE}`}>{process.env.NEXT_PUBLIC_WORK_PHONE}</a></p>
        <div className="d-flex align-items-center justify-content-center justify-content-xl-start gap-3">
          <Link href={process.env.NEXT_PUBLIC_URL_PERSONAL_TG_ACCOUNT ?? routes.homePage} title={t('personalTelegram')} target="_blank">
            <Image src={telegramIcon} width="35" priority alt={t('personalTelegram')} />
          </Link>
          <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.homePage} title={t('telegram')} target="_blank">
            <Image src={telegramIcon} width="35" priority alt={t('telegram')} />
          </Link>
          <Link href={process.env.NEXT_PUBLIC_URL_INST_ACCOUNT ?? routes.homePage} title={t('instagram')} target="_blank">
            <Image src={instagramIcon} width="35" priority alt={t('instagram')} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
