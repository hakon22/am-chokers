import Link from 'next/link';
import Image from 'next/image';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

import { catalogPath, routes } from '@/routes';
import styles from '@/themes/v2/components/home/HeroSection.module.scss';
import type { GeneralPageCoverImageInterface } from '@/types/item/Item';

interface HeroSectionProps {
  coverImages: GeneralPageCoverImageInterface;
}

export const HeroSection = ({ coverImages }: HeroSectionProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home.hero' });

  return (
    <div className={styles.hero}>
      <div className={styles.heroLeft}>
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>{t('eyebrow')}</div>
          <h1 className={styles.heroH1}>
            {t('title')} <em>{t('titleEm')}</em>
          </h1>
          <p className={styles.heroSub}>{t('subtitle')}</p>
          <div className={styles.heroBtns}>
            <Link href={catalogPath}>
              <Button type="primary" size="large" className={styles.btnPrimary}>
                {t('catalogBtn')}
              </Button>
            </Link>
            <Link href={routes.page.base.contactsPage}>
              <Button size="large" className={styles.btnOutline}>
                {t('customOrderBtn')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.heroRight}>
        {coverImages.coverImage1 ? (
          <Image
            src={coverImages.coverImage1.url}
            alt={t('heroImageAlt')}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        ) : (
          <div className={styles.heroImgPlaceholder}>
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <path d="M50 20C50 20 30 35 30 50C30 61.05 39 70 50 70C61.05 70 70 61.05 70 50C70 35 50 20 50 20Z" stroke="#A1B3CD" strokeWidth="2" fill="none" />
              <circle cx="50" cy="50" r="8" stroke="#A1B3CD" strokeWidth="2" fill="none" />
              <path d="M50 10 L50 20 M50 80 L50 90 M10 50 L20 50 M80 50 L90 50" stroke="#A1B3CD" strokeWidth="1.5" />
            </svg>
            <span className={styles.heroImgLabel}>{t('heroImageAlt')}</span>
          </div>
        )}
        <div className={styles.heroCard}>
          <div>
            <div className={styles.heroCardNum}>240+</div>
            <div className={styles.heroCardLbl}>{t('heroCardLabel')}</div>
          </div>
          <div className={styles.heroCardDot} />
        </div>
        <Link href={`${catalogPath}?new=true`} className={styles.heroTag}>
          {t('heroTag')}
        </Link>
      </div>
    </div>
  );
};
