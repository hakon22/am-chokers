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
        <div className="col-12 col-xl-6">
          <h6 className="mb-4">{t('contacts')}</h6>
          <ul>
            <li className="text-muted"><Link href="mailto:support@amchokers.ru">support@amchokers.ru</Link></li>
            <li className="text-muted">Каледкин Алексей Леонидович</li>
            <li className="text-muted">ИНН 772481458341</li>
          </ul>
          <ul>
            <li className="d-flex gap-3"><Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.homePage} title={t('telegram')} target="_blank">
              <Image src={telegramIcon} width="35" priority alt={t('telegram')} />
            </Link>
            <Link href={process.env.NEXT_PUBLIC_URL_INST_ACCOUNT ?? routes.homePage} title={t('instagram')} target="_blank">
              <Image src={instagramIcon} width="35" priority alt={t('instagram')} />
            </Link></li>
          </ul>
        </div>
        <div className="col-12 col-xl-6">
          <h6 className="mb-4">Информация</h6>
          <ul>
            <li className="text-muted"><Link href="/">{t('privacyPolicy')}</Link></li>
            <li className="text-muted"><Link href="/">{t('offerAgreement')}</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
