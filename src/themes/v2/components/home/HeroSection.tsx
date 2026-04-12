import Link from 'next/link';
import { useContext } from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

import { MobileContext } from '@/components/Context';
import { catalogPath, routes } from '@/routes';
import loginImage from '@/images/login.image.jpg';
import { BannerSlider } from '@/themes/v2/components/home/BannerSlider';
import styles from '@/themes/v2/components/home/HeroSection.module.scss';
import { V2Image } from '@/themes/v2/components/V2Image';
import type { BannerInterface } from '@/types/banner/BannerInterface';

interface HeroSectionProps {
  banners: BannerInterface[];
}

export const HeroSection = ({ banners }: HeroSectionProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home.hero' });
  const { isMobile } = useContext(MobileContext);
  const showBannerCarousel = !isMobile && banners.length > 0;

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
            <Link href={catalogPath} className={styles.heroBtnLink}>
              <Button type="default" className={styles.btnPrimary}>
                {t('catalogBtn')}
              </Button>
            </Link>
            <Link href={routes.page.base.contactsPage} className={styles.heroBtnLink}>
              <Button type="default" className={styles.btnOutline}>
                {t('customOrderBtn')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.heroRight}>
        {showBannerCarousel ? (
          <div className={styles.heroCarousel}>
            <BannerSlider variant="hero" banners={banners} />
          </div>
        ) : (
          <V2Image
            src={loginImage}
            alt={t('heroImageAlt')}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        )}
        <div className={styles.heroCard}>
          <div>
            <div className={styles.heroCardNum}>200+</div>
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
