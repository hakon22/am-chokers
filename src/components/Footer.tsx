import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import cn from 'classnames';
import { useContext } from 'react';

import telegramIcon from '@/images/icons/telegram.svg';
import instagramIcon from '@/images/icons/instagram.svg';
import { catalogPath, routes } from '@/routes';
import { useAppSelector } from '@/utilities/hooks';
import { MobileContext } from '@/components/Context';

export const Footer = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.footer' });

  const { isMobile } = useContext(MobileContext);

  const { itemGroups } = useAppSelector((state) => state.app);

  return (
    <div className="container d-flex col-12">
      <div className="d-flex flex=column flex-xl-row justify-content-between col-12 col-xl-6">
        <div className="col-6">
          <h6 className="mb-4">{t('jewelryCatalog')}</h6>
          <ul>
            <li><Link href={routes.catalog}>{t('jewelryCatalog')}</Link></li>
            {itemGroups.map((itemGroup) => <li key={itemGroup.id}><Link href={`${catalogPath}/${itemGroup.code}`}>{itemGroup.name}</Link></li>)}
          </ul>
        </div>
        <div className={cn('col-6', { 'd-flex flex-column align-items-end': isMobile })}>
          <h6 className="mb-4">{t('contacts')}</h6>
          <div className="d-flex gap-3 mb-3-5">
            <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.homePage} title={t('telegram')} target="_blank">
              <Image src={telegramIcon} width="35" priority alt={t('telegram')} />
            </Link>
            <Link href={process.env.NEXT_PUBLIC_URL_INST_ACCOUNT ?? routes.homePage} title={t('instagram')} target="_blank">
              <Image src={instagramIcon} width="35" priority alt={t('instagram')} />
            </Link>
          </div>
          <ul style={isMobile ? { textAlign: 'end' } : {}}>
            <li className="text-muted"><Link href="/">{t('privacyPolicy')}</Link></li>
            <li className="text-muted"><Link href="/">{t('offerAgreement')}</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
