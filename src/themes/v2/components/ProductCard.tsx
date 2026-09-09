import Link from 'next/link';
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
  type SyntheticEvent,
} from 'react';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { Rate } from 'antd';
import moment from 'moment';
import { isNil } from 'lodash';
import type { ImageProps } from 'next/image';

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

const PRODUCT_CARD_IMAGE_SIZES = '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw';

type ProductCardMediaRef = HTMLImageElement | HTMLVideoElement;

interface ProductCardMediaItemProps {
  src: string;
  alt: string;
  showLoadingSkeleton?: boolean;
  loading?: ImageProps['loading'];
  onLoad?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoadedData?: (event: SyntheticEvent<HTMLVideoElement, Event>) => void;
  mediaRef?: Ref<ProductCardMediaRef>;
}

/**
 * Проверяет, что src указывает на mp4
 * @param src - путь к файлу
 * @returns true для видео
 */
const isVideo = (src: string): boolean => src.endsWith('.mp4');

/**
 * Проверяет, что img или video уже декодированы и их не нужно запрашивать снова
 * @param mediaElement - DOM-элемент второго фото карточки
 * @returns true, если кадр уже готов к показу
 */
const isHoverMediaComplete = (mediaElement: ProductCardMediaRef | null): boolean => {
  if (isNil(mediaElement)) {
    return false;
  }

  if (mediaElement instanceof HTMLVideoElement) {
    return mediaElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
  }

  return mediaElement.complete && Boolean(mediaElement.naturalWidth);
};

/**
 * Рендерит фото или видео в слоте карточки
 * @param src - сырой путь к файлу
 * @param alt - текст alt
 * @param showLoadingSkeleton - скелетон до onLoad (только обложка)
 * @param loading - lazy/eager для next/image
 * @param onLoad - колбэк загрузки img
 * @param onLoadedData - колбэк готовности video
 * @param mediaRef - ref на DOM img или video
 * @returns фото или video для слота карточки
 */
const MediaItem = ({
  src,
  alt,
  showLoadingSkeleton,
  loading,
  onLoad,
  onLoadedData,
  mediaRef,
}: ProductCardMediaItemProps) => isVideo(src)
  ? (
    <video
      ref={mediaRef as Ref<HTMLVideoElement>}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      onLoadedData={onLoadedData}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
  : (
    <V2Image
      ref={mediaRef as Ref<HTMLImageElement>}
      src={src}
      alt={alt}
      fill
      sizes={PRODUCT_CARD_IMAGE_SIZES}
      style={{ objectFit: 'cover' }}
      showLoadingSkeleton={showLoadingSkeleton}
      loading={loading}
      onLoad={onLoad}
    />
  );

export interface ProductCardProps {
  item: ItemInterface;
  badge?: 'new' | 'sale';
  rating?: { rating?: ItemInterface['rating']; grades: ItemInterface['grades'] };
  outStock?: string | Date;
}

/**
 * Карточка товара v2: обложка и второе каталожное фото по наведению
 * @param item - товар
 * @param badge - бейдж new/sale
 * @param rating - рейтинг для звезды
 * @param outStock - дата «нет в наличии», если товар отсутствует
 * @returns карточка каталога v2
 */
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
  const catalogImages = useMemo(
    () => sortItemImagesByOrder(item.images).filter((catalogImage) => !catalogImage.tryOn),
    [item.images],
  );
  const image = catalogImages[0];
  const hoverImage = catalogImages[1];
  const hoverImageSource = hoverImage?.src;
  const grade = rating?.rating?.rating ?? 0;
  const imageAlt = buildItemImageAlt(item);
  const hoverMediaElementRef = useRef<ProductCardMediaRef | null>(null);
  const [shouldLoadHoverImage, setShouldLoadHoverImage] = useState(false);
  const [isHoverImageReady, setIsHoverImageReady] = useState(false);

  /**
   * Сбрасывает прогрев hover-слоя при смене второго каталожного фото
   */
  useEffect(() => {
    setShouldLoadHoverImage(false);
    setIsHoverImageReady(false);
  }, [hoverImageSource]);

  /**
   * Сохраняет DOM второго фото и отмечает его готовым, если оно уже complete
   * @param mediaElement - img или video hover-слоя
   */
  const assignHoverMediaRef = (mediaElement: ProductCardMediaRef | null) => {
    hoverMediaElementRef.current = mediaElement;

    if (isHoverMediaComplete(mediaElement)) {
      setIsHoverImageReady(true);
    }
  };

  /**
   * Помечает второе фото карточки готовым к CSS-свопу
   */
  const handleHoverImageReady = () => {
    setIsHoverImageReady(true);
  };

  /**
   * Прогревает галерею PDP и один раз запускает загрузку второго фото карточки
   */
  const handleCardWarmup = () => {
    preloadProductGalleryImages(item.images);

    if (isNil(hoverImage)) {
      return;
    }

    if (isHoverImageReady || isHoverMediaComplete(hoverMediaElementRef.current)) {
      setIsHoverImageReady(true);
      return;
    }

    setShouldLoadHoverImage(true);
  };

  /**
   * Добавляет товар в избранное или убирает его
   * @param event - клик по кнопке сердца
   */
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
        onPointerEnter={handleCardWarmup}
        onFocus={handleCardWarmup}
        onClickCapture={handleCardWarmup}
      >
        <div
          className={cn(styles.cardImg, {
            [styles.cardImgOutStock]: outStock,
            [styles.cardImgHasHover]: !isNil(hoverImage),
            [styles.cardImgHoverReady]: isHoverImageReady,
          })}
        >
          {image ? (
            <>
              <div className={styles.imgPrimary}>
                <MediaItem src={image.src} alt={imageAlt} showLoadingSkeleton />
              </div>
              {hoverImage && shouldLoadHoverImage ? (
                <div className={styles.imgSecondary}>
                  <MediaItem
                    src={hoverImage.src}
                    alt={imageAlt}
                    loading="eager"
                    mediaRef={assignHoverMediaRef}
                    onLoad={handleHoverImageReady}
                    onLoadedData={handleHoverImageReady}
                  />
                </div>
              ) : null}
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
