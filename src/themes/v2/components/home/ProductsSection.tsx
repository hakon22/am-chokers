import Link from 'next/link';
import Image from 'next/image';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { HeartOutlined } from '@ant-design/icons';

import { catalogPath } from '@/routes';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { SubmitContext } from '@/components/Context';
import { addCartItem } from '@/slices/cartSlice';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { getHref } from '@/utilities/getHref';
import type { CartItemFormInterface } from '@/types/cart/Cart';
import type { ItemInterface, GeneralPageBestsellerInterface } from '@/types/item/Item';
import { HomeSectionWrapper } from '@/themes/v2/components/home/HomeSectionWrapper';
import styles from '@/themes/v2/components/home/ProductsSection.module.scss';

const isVideo = (src: string) => src.endsWith('.mp4');

const MediaItem = ({ src, alt, className }: { src: string; alt: string; className: string; }) => isVideo(src)
  ? (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
  : <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} className={className} />;

interface ProductCardProps {
  item: ItemInterface;
  badge?: 'new' | 'sale';
}

const ProductCard = ({ item, badge }: ProductCardProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const dispatch = useAppDispatch();
  const { setIsSubmit } = useContext(SubmitContext);
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const name = item.translations?.find((tr) => tr.lang === lang)?.name ?? item.translateName;
  const groupName = item.group?.translations?.find((tr) => tr.lang === lang)?.name ?? '';
  const image = item.images?.[0];
  const image2 = item.images?.[1];

  const onAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSubmit(true);
    await dispatch(addCartItem({ count: 1, item: { id: item.id } } as CartItemFormInterface));
    setIsSubmit(false);
  };

  return (
    <Link href={getHref(item)} className={styles.card}>
      <div className={styles.cardImg}>
        {image ? (
          <>
            <MediaItem src={image.src} alt={name ?? ''} className={styles.imgPrimary} />
            {image2 && (
              <MediaItem src={image2.src} alt={name ?? ''} className={styles.imgSecondary} />
            )}
          </>
        ) : (
          <div className={styles.cardImgBg}>
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <path d="M50 20C50 20 30 35 30 50C30 61.05 39 70 50 70C61.05 70 70 61.05 70 50C70 35 50 20 50 20Z" stroke="#A1B3CD" strokeWidth="2" fill="none" />
              <circle cx="50" cy="50" r="8" stroke="#A1B3CD" strokeWidth="2" fill="none" />
            </svg>
          </div>
        )}
        {badge && <span className={`${styles.cardBadge} ${styles[badge]}`}>{badge === 'new' ? t('badgeNew') : t('badgeSale')}</span>}
        <button className={styles.cardFav} aria-label={t('favorites')} onClick={(e) => e.preventDefault()}>
          <HeartOutlined />
        </button>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardCat}>{groupName}</div>
        <div className={styles.cardName}>{name}</div>
        <div className={styles.cardPrice}>
          {item.price} ₽
          {item.discountPrice && <span className={styles.cardPriceOld}>{item.discountPrice} ₽</span>}
        </div>
      </div>
      <div className={styles.cardFooter}>
        <button className={styles.cardBtn} onClick={onAddToCart}>{t('addToCart')}</button>
      </div>
    </Link>
  );
};

interface ProductsSectionProps {
  news: ItemInterface[];
  bestsellers: GeneralPageBestsellerInterface;
}

export const ProductsSection = ({ news, bestsellers }: ProductsSectionProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home' });

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
          <div className={styles.grid4}>
            {news.slice(0, 4).map((item) => (
              <ProductCard key={item.id} item={item} badge="new" />
            ))}
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
            <Link href={catalogPath} className={styles.seeAllLink}>
              {t('seeAll')} →
            </Link>
          </div>
          <div className={styles.grid3}>
            {bestsellerList.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </HomeSectionWrapper>
      )}
    </>
  );
};
