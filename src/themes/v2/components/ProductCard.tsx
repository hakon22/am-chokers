import Link from 'next/link';
import { useContext, useMemo } from 'react';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { Rate } from 'antd';
import moment from 'moment';

import { getHref } from '@/utilities/getHref';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { SubmitContext, AuthModalContext } from '@/components/Context';
import { addFavorites, removeFavorites } from '@/slices/userSlice';
import { V2Image } from '@/themes/v2/components/V2Image';
import { V2CartControl } from '@/themes/v2/components/V2CartControl';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { buildItemImageAlt } from '@/utilities/buildItemImageAlt';
import { preloadProductGalleryImages } from '@/utilities/preloadProductGalleryImages';
import { sortItemImagesByOrder } from '@/utilities/sortItemImagesByOrder';
import styles from '@/themes/v2/components/home/ProductsSection.module.scss';
import type { ItemInterface } from '@/types/item/Item';

const isVideo = (src: string) => src.endsWith('.mp4');

const MediaItem = ({
  src,
  alt,
  showLoadingSkeleton,
}: {
  src: string;
  alt: string;
  showLoadingSkeleton?: boolean;
}) => isVideo(src)
  ? (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
  : (
    <V2Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      style={{ objectFit: 'cover' }}
      showLoadingSkeleton={showLoadingSkeleton}
    />
  );

export interface ProductCardProps {
  item: ItemInterface;
  badge?: 'new' | 'sale';
  rating?: { rating?: ItemInterface['rating']; grades: ItemInterface['grades'] };
  outStock?: string | Date;
}

export const ProductCard = ({ item, badge, rating, outStock }: ProductCardProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const dispatch = useAppDispatch();
  const { setIsSubmit } = useContext(SubmitContext);
  const { openAuthModal } = useContext(AuthModalContext);
  const { token, favorites } = useAppSelector((state) => state.user);
  const lang = useUserLang();
  const inFavorites = favorites?.find((favItem) => favItem.id === item.id);
  const name = item.translations?.find((translation) => translation.lang === lang)?.name ?? item.translateName;
  const groupName = item.group?.translations?.find((translation) => translation.lang === lang)?.name ?? '';
  const sortedImages = useMemo(() => sortItemImagesByOrder(item.images), [item.images]);
  const image = sortedImages[0];
  const image2 = sortedImages[1];
  const grade = rating?.rating?.rating ?? 0;
  const imageAlt = buildItemImageAlt(item);

  /**
   * Прогревает всю растровую галерею до перехода на PDP
   */
  const warmProductGalleryImages = () => {
    preloadProductGalleryImages(item.images);
  };

  const onFavoritesClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!token) {
      openAuthModal?.('login');
      return;
    }
    setIsSubmit(true);
    await dispatch(inFavorites ? removeFavorites(inFavorites.id) : addFavorites(item.id));
    setIsSubmit(false);
  };

  return (
    <div className={styles.cardWrapper}>
      <Link
        href={getHref(item)}
        className={styles.card}
        onPointerEnter={warmProductGalleryImages}
        onFocus={warmProductGalleryImages}
        onClickCapture={warmProductGalleryImages}
      >
        <div className={cn(styles.cardImg, { [styles.cardImgOutStock]: outStock })}>
          {image ? (
            <>
              <div className={styles.imgPrimary}>
                <MediaItem src={image.src} alt={imageAlt} showLoadingSkeleton />
              </div>
              {image2 && (
                <div className={styles.imgSecondary}>
                  <MediaItem src={image2.src} alt={imageAlt} />
                </div>
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
          {outStock && (
            <div className={styles.outStock} role="status">
              <span className={styles.outStockLabel}>{tCart('isAbsentLabel')}</span>
              <span className={styles.outStockDate}>
                {tCart('isAbsentDate', { date: moment(outStock).format(DateFormatEnum.DD_MM) })}
              </span>
            </div>
          )}
          <button className={styles.cardFav} aria-label={t('favorites')} onClick={onFavoritesClick}>
            {inFavorites ? <HeartFilled style={{ color: '#4d689e' }} /> : <HeartOutlined />}
          </button>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardCatRow}>
            <div className={styles.cardCat}>{groupName}</div>
            {rating ? (
              <div className={styles.cardRating}>
                <Rate disabled allowHalf count={1} value={grade} />
                <span>{grade}</span>
              </div>
            ) : null}
          </div>
          <div className={styles.cardName}>{name}</div>
          <div className={styles.cardPrice}>
            {t('price', { price: item.discountPrice ? item.price - item.discountPrice : item.price })}
            {item.discountPrice ? (
              <span className={styles.cardPriceOld}>{t('price', { price: item.price })}</span>
            ) : null}
          </div>
        </div>
        <div className={styles.cardFooter}>
          <V2CartControl
            variant="card"
            itemId={item.id}
            inCartLabel={t('inCartLabel')}
            addLabel={t('addToCart')}
            removeAriaLabel={t('remove')}
            addAriaLabel={t('add')}
          />
        </div>
      </Link>
    </div>
  );
};
