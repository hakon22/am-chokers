import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import { MobileContext } from '@/components/Context';
import { useCarouselInteractionAutoplayPause } from '@/hooks/useCarouselInteractionAutoplayPause';
import { catalogPath } from '@/routes';
import { CAROUSEL_MINIMUM_TOUCH_DRAG_PX } from '@/utilities/carouselMinimumTouchDrag';
import { getWidth } from '@/utilities/screenExtension';
import { HomeSectionWrapper } from '@/themes/v2/components/home/HomeSectionWrapper';
import { ProductCard } from '@/themes/v2/components/ProductCard';
import styles from '@/themes/v2/components/home/ProductsSection.module.scss';
import type { ItemInterface, GeneralPageBestsellerInterface } from '@/types/item/Item';

interface ProductsSectionProps {
  news: ItemInterface[];
  bestsellers: GeneralPageBestsellerInterface;
  automaticSalesHits: boolean;
  salesHits: ItemInterface[];
  salesHitsLimit: number;
}

const newsCarouselResponsive = {
  desktop: { breakpoint: { max: 5000, min: 1200 }, items: 4 },
  tablet: { breakpoint: { max: 1199, min: 768 }, items: 3 },
  mobile: { breakpoint: { max: 767, min: 0 }, items: 2 },
};

/**
 * Возвращает число карточек «Хиты продаж» по ширине viewport
 * @param viewportWidth - ширина окна в px
 * @returns 4 на десктопе, 3 на планшете, 2 на телефоне
 */
const getBestsellerVisibleCountByViewportWidth = (viewportWidth: number): number => {
  if (viewportWidth <= 768) {
    return 2;
  }
  if (viewportWidth <= 1199) {
    return 3;
  }
  return 4;
};

export const ProductsSection = ({
  news,
  bestsellers,
  automaticSalesHits,
  salesHits,
  salesHitsLimit,
}: ProductsSectionProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home' });
  const { isMobile } = useContext(MobileContext);
  const { isAutoplayPausedByInteraction, interactionPauseProps } = useCarouselInteractionAutoplayPause();
  const [autoPlay, setAutoPlay] = useState(false);
  const [bestsellerVisibleCount, setBestsellerVisibleCount] = useState(salesHitsLimit);

  useEffect(() => {
    /**
     * Синхронизирует число карточек хитов продаж с текущей шириной окна
     */
    const handleResize = () => {
      setBestsellerVisibleCount(getBestsellerVisibleCountByViewportWidth(getWidth()));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAutoPlay(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const manualBestsellerList = [
    bestsellers.bestseller1,
    bestsellers.bestseller2,
    bestsellers.bestseller3,
  ].filter(Boolean) as ItemInterface[];

  const bestsellerSourceList = automaticSalesHits ? salesHits : manualBestsellerList;
  const bestsellerList = bestsellerSourceList.slice(0, bestsellerVisibleCount);

  return (
    <>
      {/* New arrivals */}
      {news.length > 0 && (
        <HomeSectionWrapper alt>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.eyebrow}>{t('newArrivals.eyebrow')}</div>
              <h2 className={styles.title}>{t('newArrivals.title')}</h2>
            </div>
            <Link href={`${catalogPath}?new=true`} className={styles.seeAllLink}>
              {t('seeAll')} →
            </Link>
          </div>
          <div {...interactionPauseProps}>
            <Carousel
              responsive={newsCarouselResponsive}
              autoPlay={autoPlay && !isAutoplayPausedByInteraction}
              autoPlaySpeed={2500}
              infinite
              pauseOnHover={false}
              shouldResetAutoplay
              showDots={false}
              arrows={false}
              slidesToSlide={1}
              swipeable
              draggable={false}
              minimumTouchDrag={CAROUSEL_MINIMUM_TOUCH_DRAG_PX}
              deviceType={isMobile ? 'mobile' : 'desktop'}
              itemClass={styles.carouselItem}
              containerClass={styles.carouselContainer}
            >
              {news.map((item) => (
                <ProductCard key={item.id} item={item} badge="new" rating={{ rating: item.rating, grades: item.grades }} />
              ))}
            </Carousel>
          </div>
        </HomeSectionWrapper>
      )}

      {/* Bestsellers */}
      {bestsellerList.length > 0 && (
        <HomeSectionWrapper>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.eyebrow}>{t('bestsellers.eyebrow')}</div>
              <h2 className={styles.title}>{t('bestsellers.title')}</h2>
            </div>
            <Link href={`${catalogPath}?bestseller=true`} className={styles.seeAllLink}>
              {t('seeAll')} →
            </Link>
          </div>
          <div className={styles.grid3}>
            {bestsellerList.map((item) => (
              <ProductCard key={item.id} item={item} rating={{ rating: item.rating, grades: item.grades }} />
            ))}
          </div>
        </HomeSectionWrapper>
      )}
    </>
  );
};
