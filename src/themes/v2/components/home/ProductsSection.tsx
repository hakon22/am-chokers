import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import { catalogPath } from '@/routes';
import type { ItemInterface, GeneralPageBestsellerInterface } from '@/types/item/Item';
import { HomeSectionWrapper } from '@/themes/v2/components/home/HomeSectionWrapper';
import { ProductCard } from '@/themes/v2/components/ProductCard';
import styles from '@/themes/v2/components/home/ProductsSection.module.scss';

interface ProductsSectionProps {
  news: ItemInterface[];
  bestsellers: GeneralPageBestsellerInterface;
}

const newsCarouselResponsive = {
  desktop: { breakpoint: { max: 5000, min: 1200 }, items: 4 },
  tablet: { breakpoint: { max: 1199, min: 768 }, items: 3 },
  mobile: { breakpoint: { max: 767, min: 0 }, items: 2 },
};

export const ProductsSection = ({ news, bestsellers }: ProductsSectionProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home' });
  const [autoPlay, setAutoPlay] = useState(false);

  useState(() => {
    const timer = setTimeout(() => setAutoPlay(true), 2000);
    return () => clearTimeout(timer);
  });

  const bestsellerList = [
    bestsellers.bestseller1,
    bestsellers.bestseller2,
    bestsellers.bestseller3,
  ].filter(Boolean) as ItemInterface[];

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
          <Carousel
            responsive={newsCarouselResponsive}
            autoPlay={autoPlay}
            autoPlaySpeed={2500}
            infinite
            pauseOnHover
            shouldResetAutoplay
            showDots={false}
            arrows={false}
            slidesToSlide={1}
            swipeable
            draggable={false}
            itemClass={styles.carouselItem}
            containerClass={styles.carouselContainer}
          >
            {news.map((item) => (
              <ProductCard key={item.id} item={item} badge="new" rating={{ rating: item.rating, grades: item.grades }} />
            ))}
          </Carousel>
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
            <Link href={catalogPath} className={styles.seeAllLink}>
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
