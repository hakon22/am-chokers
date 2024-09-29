import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import telegramIcon from '@/images/icons/telegram.svg';
import instagramIcon from '@/images/icons/instagram.svg';

export const Footer = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index.footer' });

  return (
    <div className="container d-flex col-12">
      <div className="d-flex justify-content-between col-6">
        <div className="col-6">
          <h6 className="mb-4">{t('jewelryCatalog')}</h6>
          <ul>
            <li><Link href="/">{t('jewelryCatalog')}</Link></li>
            <li><Link href="/">{t('bracelets')}</Link></li>
            <li><Link href="/">{t('glassesChains')}</Link></li>
            <li><Link href="/">{t('otherAccessories')}</Link></li>
            <li><Link href="/">{t('allJewelry')}</Link></li>
          </ul>
        </div>
        <div className="col-6">
          <h6 className="mb-4">{t('contacts')}</h6>
          <div className="d-flex gap-3 mb-3-5">
            <Link href="https://t.me/AMChokers" target="_blank">
              <Image src={telegramIcon} width="35" alt={t('telegram')} />
            </Link>
            <Link href="https://www.instagram.com/a_m_chokers?igsh=d2hoeXYyNXkzZXpy" target="_blank">
              <Image src={instagramIcon} width="35" alt={t('instagram')} />
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
