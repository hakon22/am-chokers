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
      <div className="d-flex flex-column flex-xl-row justify-content-between col-12 col-xl-6 gap-4 gap-xl-0">
        <div className="col-12 col-xl-6">
          <h6 className="mb-4">{t('jewelryCatalog')}</h6>
          <ul>
            <li><Link href={routes.catalog}>{t('jewelryCatalog')}</Link></li>
            {itemGroups.map((itemGroup) => <li key={itemGroup.id}><Link href={`${catalogPath}/${itemGroup.code}`}>{itemGroup.name}</Link></li>)}
          </ul>
        </div>
        <div className="col-12 col-xl-8">
          <h6 className="mb-4">{t('contacts')}</h6>
          <ul>
            <li className="text-muted"><Link href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_MAIL}`}>{process.env.NEXT_PUBLIC_CONTACT_MAIL}</Link></li>
          </ul>
          <ul>
            <li className="d-flex gap-3 mb-2">
              <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.homePage} title={t('telegram')} target="_blank">
                <Image src={telegramIcon} width="35" priority alt={t('telegram')} />
              </Link>
              <Link href={process.env.NEXT_PUBLIC_URL_INST_ACCOUNT ?? routes.homePage} className="instagram" title={t('instagram')} target="_blank">
                <Image src={instagramIcon} width="35" priority alt={t('instagram')} />
              </Link>
            </li>
            <li className="d-flex flex-column text-muted fs-6-5">
              <span>{t('instagramText1')}</span>
              <span>{t('instagramText2')}</span>
            </li>
          </ul>
        </div>
        <div className="col-12 col-xl-6">
          <h6 className="mb-4">{t('info')}</h6>
          <ul>
            <li className="text-muted">{process.env.NEXT_PUBLIC_FIO}</li>
            <li className="text-muted mb-3">{process.env.NEXT_PUBLIC_INN}</li>
            <li className="text-muted"><Link href={routes.privacyPolicy}>{t('privacyPolicy')}</Link></li>
            <li className="text-muted"><Link href={routes.offerAgreement}>{t('offerAgreement')}</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
