import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';

import telegramIcon from '@/images/icons/telegram.svg';
import instagramIcon from '@/images/icons/instagram.svg';
import { catalogPath, routes } from '@/routes';
import { useAppSelector } from '@/utilities/hooks';

export const Footer = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.footer' });

  const { itemGroups } = useAppSelector((state) => state.app);

  return (
    <div className="container d-flex col-12">
      <div className="d-flex justify-content-between col-6">
        <div className="col-6">
          <h6 className="mb-4">{t('jewelryCatalog')}</h6>
          <ul>
            <li><Link href={routes.catalog}>{t('jewelryCatalog')}</Link></li>
            {itemGroups.map((itemGroup) => <li key={itemGroup.id}><Link href={`${catalogPath}/${itemGroup.code}`}>{itemGroup.name}</Link></li>)}
          </ul>
        </div>
        <div className="col-6">
          <h6 className="mb-4">{t('contacts')}</h6>
          <div className="d-flex gap-3 mb-3-5">
            <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.homePage} target="_blank">
              <Image src={telegramIcon} width="35" priority alt={t('telegram')} />
            </Link>
            <Link href={process.env.NEXT_PUBLIC_URL_INST_ACCOUNT ?? routes.homePage} target="_blank">
              <Image src={instagramIcon} width="35" priority alt={t('instagram')} />
            </Link>
          </div>
          <ul>
            <li className="text-muted"><Link href="/">{t('privacyPolicy')}</Link></li>
            <li className="text-muted"><Link href="/">{t('offerAgreement')}</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
