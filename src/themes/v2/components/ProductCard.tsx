import Link from 'next/link';
import { useContext, useMemo, useState } from 'react';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { Rate, Skeleton } from 'antd';
import moment from 'moment';

import { getHref } from '@/utilities/getHref';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { SubmitContext, AuthModalContext } from '@/components/Context';
import { addFavorites, removeFavorites } from '@/slices/userSlice';
import { V2Image } from '@/themes/v2/components/V2Image';
import { V2CartControl } from '@/themes/v2/components/V2CartControl';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { sortItemImagesByOrder } from '@/utilities/sortItemImagesByOrder';
import styles from '@/themes/v2/components/home/ProductsSection.module.scss';
import type { ItemInterface } from '@/types/item/Item';

const isVideo = (src: string) => src.endsWith('.mp4');

const MediaItem = ({ src, alt, className, onLoad }: { src: string; alt: string; className: string; onLoad?: () => void; }) => isVideo(src)
  ? (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      className={className}
      onLoadedData={onLoad}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
  : <V2Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} className={className} onLoad={onLoad} />;

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
  const { lang = UserLangEnum.RU, token, favorites } = useAppSelector((state) => state.user);
  const [imgLoading, setImgLoading] = useState(true);
  const inFavorites = favorites?.find((favItem) => favItem.id === item.id);
  const name = item.translations?.find((translation) => translation.lang === lang)?.name ?? item.translateName;
  const groupName = item.group?.translations?.find((translation) => translation.lang === lang)?.name ?? '';
  const sortedImages = useMemo(() => sortItemImagesByOrder(item.images), [item.images]);
  const image = sortedImages[0];
  const image2 = sortedImages[1];
  const grade = rating?.rating?.rating ?? 0;

  const onFavoritesClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      <Link href={getHref(item)} className={styles.card}>
        <div className={cn(styles.cardImg, { [styles.cardImgOutStock]: outStock })}>
          {image ? (
            <>
              {imgLoading && (
                <Skeleton.Image active style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} classNames={{ content: 'w-100 h-100' }} />
              )}
              <MediaItem src={image.src} alt={name ?? ''} className={styles.imgPrimary} onLoad={() => setImgLoading(false)} />
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
            {item.price} ₽
            {item.discountPrice ? <span className={styles.cardPriceOld}>{item.discountPrice} ₽</span> : null}
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
