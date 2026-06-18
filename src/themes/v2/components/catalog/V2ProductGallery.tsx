import {
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEventHandler,
} from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ImageGallery, { type ImageGalleryRef } from 'react-image-gallery';
import 'react-image-gallery/styles/image-gallery.css';
import cn from 'classnames';
import { isNil } from 'lodash';

import { MobileContext } from '@/components/Context';
import { useMobileGalleryThumbnailScrollGuard } from '@/hooks/useMobileGalleryThumbnailScrollGuard';
import { ProductGalleryVideo } from '@/themes/v2/components/catalog/ProductGalleryVideo';
import { ProductGallerySlideImage } from '@/themes/v2/components/catalog/ProductGallerySlideImage';
import { ProductGalleryThumbnailImage } from '@/themes/v2/components/catalog/ProductGalleryThumbnailImage';
import { sortItemImagesByOrder } from '@/utilities/sortItemImagesByOrder';
import { shouldDisableMobileThumbnailSwipe } from '@/utilities/galleryMobileThumbnails';
import { getWidth } from '@/utilities/screenExtension';
import styles from '@/themes/v2/components/catalog/V2ProductGallery.module.scss';
import type { ItemInterface } from '@/types/item/Item';

const GALLERY_MAX_MAIN_WIDTH = 560;
const GALLERY_MAX_HEIGHT_CAP = 520;
const GALLERY_VIEWPORT_HEIGHT_RESERVE = 200;
/** Thumbnails rail (~96px) + margins from react-image-gallery */
const GALLERY_THUMB_RAIL = 112;
const GALLERY_THUMB_GAP = 12;
/** Как в v1 (`CardItem`): height / width для области главного слайда */
const GALLERY_ASPECT_RATIO = 1.3;
/** Длительность смены слайда в галерее (мс); на время прыжка в fullscreen сбрасывается в 0 */
const GALLERY_SLIDE_DURATION_MS = 550;
/** Ширина viewport для SSR/hydration (совпадает с типичным телефоном) */
const SSR_MOBILE_VIEWPORT_WIDTH = 390;
/** Ширина viewport для SSR/hydration на desktop */
const SSR_DESKTOP_VIEWPORT_WIDTH = 1200;
const PHONE_VIEWPORT_MAX_WIDTH = 768;

export type V2ProductGalleryBox = {
  w: number;
  h: number;
  thumbOffset: number;
  /** Ширина основного слайда (getBoundingClientRect относительно обёртки). */
  mainSlideW: number;
};

export type V2ProductGalleryProps = {
  images: ItemInterface['images'];
  imageAlt?: string;
  /** Ключ для пересчёта layout (id товара, длина images и т.п.) */
  layoutKey?: string | number;
  sticky?: boolean;
  /** На странице товара: галерея на всю ширину viewport на мобиле */
  fullBleedOnMobile?: boolean;
  showNotice?: boolean;
  noticeShellClassName?: string;
  noticeClassName?: string;
  className?: string;
  /** Процент скидки для бейджа на главном слайде (мобильная вёрстка) */
  discountPercent?: number | null;
  /** Колбэк при изменении геометрии галереи */
  onGalleryBoxChange?: (galleryBox: V2ProductGalleryBox | null) => void;
};

/**
 * Устанавливает CSS-переменные галереи на :root для полноэкранного режима
 * @param isMobile - мобильная вёрстка
 */
const setGalleryFullscreenCssVariablesOnDocumentRoot = (isMobile: boolean) => {
  document.documentElement.style.setProperty(
    '--galleryWidth',
    isMobile ? 'calc(100% - 30px)' : 'calc(100% - 110px)',
  );
  document.documentElement.style.setProperty('--galleryHeight', '100vh');
};

/**
 * Применяет стили slide-wrapper при mobile fullscreen (thumbnails справа)
 */
const applyThumbnailsRightSlideWrapperStylesWhenMobileFullscreen = () => {
  const thumbnailsRightSlideWrapper = document.querySelector(
    '.image-gallery-slide-wrapper.image-gallery-thumbnails-right',
  ) as HTMLElement | null;
  if (thumbnailsRightSlideWrapper) {
    thumbnailsRightSlideWrapper.style.transition = 'none';
    thumbnailsRightSlideWrapper.style.width = '100%';
  }
};

/**
 * Сбрасывает inline-стили slide-wrapper после выхода из mobile fullscreen
 */
const restoreThumbnailsRightSlideWrapperStylesAfterMobileFullscreen = () => {
  const thumbnailsRightSlideWrapper = document.querySelector(
    '.image-gallery-slide-wrapper.image-gallery-thumbnails-right',
  ) as HTMLElement | null;
  if (thumbnailsRightSlideWrapper) {
    thumbnailsRightSlideWrapper.style.width = '';
    thumbnailsRightSlideWrapper.style.transition = '';
  }
};

/**
 * Возвращает текущий fullscreen-элемент документа (с префиксами вендоров)
 * @returns элемент в fullscreen или null
 */
const readFullscreenElementFromDocument = (): Element | null => {
  const documentWithLegacyFullscreenApi = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    document.fullscreenElement
    ?? documentWithLegacyFullscreenApi.webkitFullscreenElement
    ?? documentWithLegacyFullscreenApi.mozFullScreenElement
    ?? documentWithLegacyFullscreenApi.msFullscreenElement
    ?? null
  );
};

/** Шеврон навигации как в `react-image-gallery` (left / right). */
const GalleryNavSvg = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg
    className="image-gallery-svg"
    viewBox="6 0 12 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="square"
    strokeLinejoin="miter"
    strokeWidth={1}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
  </svg>
);

/** Иконки как в `react-image-gallery` (для кастомной кнопки fullscreen). */
const GalleryFullscreenSvg = ({ exit }: { exit: boolean }) => (
  <svg
    className="image-gallery-svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="square"
    strokeLinejoin="miter"
    strokeWidth={2}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    {exit ? (
      <path d="M8 3v5H3m18 0h-5V3m0 18v-5h5M3 16h5v5" />
    ) : (
      <path d="M8 3H3v5m18 0V3h-5m0 18h5v-5M3 16v5h5" />
    )}
  </svg>
);

/**
 * Общая v2-галерея товара (страница товара и админка)
 */
export const V2ProductGallery = ({
  images,
  imageAlt = '',
  layoutKey,
  sticky = false,
  fullBleedOnMobile = false,
  showNotice = false,
  noticeShellClassName,
  noticeClassName,
  className,
  discountPercent,
  onGalleryBoxChange,
}: V2ProductGalleryProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tNavbar } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { isMobile } = useContext(MobileContext);

  const galleryRef = useRef<ImageGalleryRef>(null);
  const galleryWrapRef = useRef<HTMLDivElement>(null);
  const [galleryBox, setGalleryBox] = useState<V2ProductGalleryBox | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);
  const [galleryFsCurtain, setGalleryFsCurtain] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlideIndexRef = useRef(0);
  const [gallerySlideDuration, setGallerySlideDuration] = useState(GALLERY_SLIDE_DURATION_MS);
  const fsTargetIndexRef = useRef(0);
  const fsCurtainFallbackRef = useRef<number | null>(null);
  const restoreGallerySlideDurationRef = useRef<number | null>(null);

  const sortedImages = useMemo(() => sortItemImagesByOrder(images), [images]);
  const galleryLayoutDependency = layoutKey ?? sortedImages.length;

  const updateGalleryBox = useEffectEvent((nextGalleryBox: V2ProductGalleryBox) => {
    setGalleryBox(nextGalleryBox);
    onGalleryBoxChange?.(nextGalleryBox);
  });

  /**
   * Пересчитывает размеры основного слайда и смещение миниатюр
   */
  const recomputeGalleryBox = useEffectEvent(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const wrap = galleryWrapRef.current;
    if (!wrap || wrap.clientWidth < 8) {
      return;
    }

    const fullscreenElement = document.fullscreenElement;
    if (fullscreenElement && wrap.contains(fullscreenElement)) {
      return;
    }

    const maxHeight = Math.min(GALLERY_MAX_HEIGHT_CAP, window.innerHeight - GALLERY_VIEWPORT_HEIGHT_RESERVE);
    let maxMainWidth = Math.min(GALLERY_MAX_MAIN_WIDTH, wrap.clientWidth - GALLERY_THUMB_RAIL - GALLERY_THUMB_GAP);
    if (maxMainWidth < 160) {
      maxMainWidth = Math.max(120, wrap.clientWidth - 88);
    }

    let width = maxMainWidth;
    let height = width * GALLERY_ASPECT_RATIO;
    if (height > maxHeight) {
      height = maxHeight;
      width = height / GALLERY_ASPECT_RATIO;
    }

    const slideWrapper = wrap.querySelector('.image-gallery-slide-wrapper') as HTMLElement | null;
    let thumbOffset = GALLERY_THUMB_RAIL + GALLERY_THUMB_GAP;
    let mainSlideWidth = Math.round(width);

    if (slideWrapper) {
      const wrapRect = wrap.getBoundingClientRect();
      const slideRect = slideWrapper.getBoundingClientRect();
      thumbOffset = Math.max(0, Math.round(slideRect.left - wrapRect.left));
      mainSlideWidth = Math.max(0, Math.round(slideRect.width));
    }

    updateGalleryBox({
      w: Math.round(width),
      h: Math.round(height),
      thumbOffset,
      mainSlideW: mainSlideWidth,
    });
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      galleryRef.current?.slideToIndex?.(0);
    });
  }, [galleryLayoutDependency]);

  useLayoutEffect(() => {
    recomputeGalleryBox();
  }, [galleryLayoutDependency]);

  useEffect(() => {
    const wrap = galleryWrapRef.current;
    if (!wrap) {
      return;
    }

    let slideResizeObserver: ResizeObserver | null = null;
    const disconnectSlideResizeObserver = () => {
      slideResizeObserver?.disconnect();
      slideResizeObserver = null;
    };

    const attachSlideObserver = () => {
      disconnectSlideResizeObserver();
      const slide = wrap.querySelector('.image-gallery-slide-wrapper') as HTMLElement | null;
      if (!slide) {
        return;
      }
      slideResizeObserver = new ResizeObserver(() => {
        recomputeGalleryBox();
      });
      slideResizeObserver.observe(slide);
    };

    let mutationAnimationFrame = 0;
    const onGalleryDomChange = () => {
      cancelAnimationFrame(mutationAnimationFrame);
      mutationAnimationFrame = requestAnimationFrame(() => {
        attachSlideObserver();
        recomputeGalleryBox();
      });
    };

    const mutationObserver = new MutationObserver(onGalleryDomChange);
    mutationObserver.observe(wrap, { childList: true, subtree: true });

    const wrapResizeObserver = new ResizeObserver(() => {
      recomputeGalleryBox();
    });
    wrapResizeObserver.observe(wrap);

    onGalleryDomChange();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        recomputeGalleryBox();
      });
    });

    return () => {
      cancelAnimationFrame(mutationAnimationFrame);
      mutationObserver.disconnect();
      wrapResizeObserver.disconnect();
      disconnectSlideResizeObserver();
    };
  }, [galleryLayoutDependency]);

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      recomputeGalleryBox();
    });
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentSlideIndex]);

  /**
   * Сбрасывает таймер fallback-занавеса fullscreen
   */
  const clearFsCurtainFallback = useCallback(() => {
    if (fsCurtainFallbackRef.current != null) {
      clearTimeout(fsCurtainFallbackRef.current);
      fsCurtainFallbackRef.current = null;
    }
  }, []);

  /**
   * Сбрасывает таймер восстановления длительности смены слайда
   */
  const clearRestoreGallerySlideDuration = useCallback(() => {
    if (!isNil(restoreGallerySlideDurationRef.current)) {
      clearTimeout(restoreGallerySlideDurationRef.current);
      restoreGallerySlideDurationRef.current = null;
    }
  }, []);

  /**
   * Переходит к слайду без анимации (вход в fullscreen после смены вёрстки)
   * @param index - индекс слайда в галерее
   */
  const jumpGalleryToIndex = useCallback((index: number) => {
    clearRestoreGallerySlideDuration();
    flushSync(() => {
      setGallerySlideDuration(0);
    });
    galleryRef.current?.slideToIndex?.(index);
    restoreGallerySlideDurationRef.current = window.setTimeout(() => {
      setGallerySlideDuration(GALLERY_SLIDE_DURATION_MS);
      restoreGallerySlideDurationRef.current = null;
    }, 50);
  }, [clearRestoreGallerySlideDuration]);

  /**
   * После выхода из fullscreen: миниатюры и размеры слайда, затем синхронизация индекса
   * @param indexToRestore - индекс слайда для восстановления
   */
  const restoreGalleryAfterFullscreenExit = useCallback((indexToRestore: number) => {
    clearRestoreGallerySlideDuration();
    setGallerySlideDuration(GALLERY_SLIDE_DURATION_MS);
    document.documentElement.style.setProperty('--galleryWidth', '320px');
    document.documentElement.style.setProperty('--galleryHeight', '416px');
    if (isMobile) {
      restoreThumbnailsRightSlideWrapperStylesAfterMobileFullscreen();
      flushSync(() => {
        setIsFullscreen(false);
      });
    } else {
      setIsFullscreen(false);
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        galleryRef.current?.slideToIndex?.(indexToRestore);
      });
    });
  }, [clearRestoreGallerySlideDuration, isMobile]);

  useEffect(() => () => {
    clearFsCurtainFallback();
    clearRestoreGallerySlideDuration();
  }, [clearFsCurtainFallback, clearRestoreGallerySlideDuration]);

  /**
   * Запускает таймер снятия занавеса, если fullscreenchange не сработал
   */
  const armFsCurtainFallback = useCallback(() => {
    clearFsCurtainFallback();
    fsCurtainFallbackRef.current = window.setTimeout(() => {
      setGalleryFsCurtain(false);
      fsCurtainFallbackRef.current = null;
    }, 750);
  }, [clearFsCurtainFallback]);

  useEffect(() => {
    const onFullscreenChange = () => {
      clearFsCurtainFallback();
      requestAnimationFrame(() => {
        setGalleryFsCurtain(false);
      });
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [clearFsCurtainFallback]);

  /** Escape выходит из fullscreen без нашей кнопки — занавес как при выходе по UI. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      const wrap = galleryWrapRef.current;
      const fullscreenElement = readFullscreenElementFromDocument();
      if (!wrap || !fullscreenElement || !wrap.contains(fullscreenElement)) {
        return;
      }
      flushSync(() => {
        setGalleryFsCurtain(true);
      });
      armFsCurtainFallback();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [armFsCurtainFallback]);

  const slideHeight = galleryBox?.h ?? 416;
  const slideWidth = galleryBox?.w;

  const galleryCssVars = useMemo((): CSSProperties | undefined => {
    if (!galleryBox) {
      return undefined;
    }
    return {
      '--galleryWidth': `${galleryBox.w}px`,
      '--galleryHeight': `${galleryBox.h}px`,
    } as CSSProperties;
  }, [galleryBox]);

  /**
   * Стили обёртки: inline-размеры или fullscreen-высота
   */
  const gallerySurfaceStyle = useMemo((): CSSProperties | undefined => {
    if (isFullscreen) {
      return {
        '--galleryFsHeight': isMobile ? '100svh' : '100dvh',
      } as CSSProperties;
    }
    return galleryCssVars;
  }, [isFullscreen, isMobile, galleryCssVars]);

  const [isPhoneViewport, setIsPhoneViewport] = useState(isMobile);
  const [viewportWidth, setViewportWidth] = useState(
    isMobile ? SSR_MOBILE_VIEWPORT_WIDTH : SSR_DESKTOP_VIEWPORT_WIDTH,
  );

  useEffect(() => {
    /**
     * Переключает геометрию подписи: телефон — полная ширина (CSS), планшет/десктоп — под слайд
     */
    const handleResize = () => {
      const width = getWidth();
      setViewportWidth(width);
      setIsPhoneViewport(width <= PHONE_VIEWPORT_MAX_WIDTH);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const disableThumbnailSwipe = useMemo(
    () => shouldDisableMobileThumbnailSwipe({
      isMobile,
      imageCount: sortedImages.length,
      galleryHeightPx: galleryBox?.h ?? 416,
      viewportWidth,
    }),
    [isMobile, sortedImages.length, galleryBox?.h, viewportWidth],
  );

  /**
   * Под слайдом: ширина и отступ по геометрии главного изображения (планшет и десктоп).
   * На телефоне (≤768px) — полная ширина через CSS в ProductPage.module.scss.
   */
  const noticeLayoutStyle = useMemo((): CSSProperties | undefined => {
    if (!galleryBox || isPhoneViewport) {
      return undefined;
    }
    return {
      marginLeft: `${galleryBox.thumbOffset}px`,
      width: `${galleryBox.mainSlideW}px`,
      maxWidth: 'none',
      boxSizing: 'border-box',
    };
  }, [galleryBox, isPhoneViewport]);

  /**
   * Синхронно до `requestFullscreen`: стили слайда + items
   * @returns индекс слайда для показа в fullscreen
   */
  const prepareGalleryFullscreenLayout = useCallback((): number => {
    const indexToShow = currentSlideIndex;
    fsTargetIndexRef.current = indexToShow;
    isFullscreenRef.current = true;
    flushSync(() => {
      setGallerySlideDuration(0);
      setIsFullscreen(true);
      if (!isMobile) {
        setGalleryFsCurtain(true);
      }
    });
    if (!isMobile) {
      armFsCurtainFallback();
    }
    setGalleryFullscreenCssVariablesOnDocumentRoot(isMobile);
    if (isMobile) {
      applyThumbnailsRightSlideWrapperStylesWhenMobileFullscreen();
    }
    return indexToShow;
  }, [armFsCurtainFallback, currentSlideIndex, isMobile]);

  /**
   * Открывает галерею в полноэкранном режиме
   */
  const openGalleryFullscreen = useCallback(() => {
    if (isFullscreenRef.current) {
      return;
    }
    prepareGalleryFullscreenLayout();
    galleryRef.current?.fullScreen();
  }, [prepareGalleryFullscreenLayout]);

  const renderGalleryFullscreenButton = useCallback(
    (onClick: () => void, isFullscreenMode: boolean) => (
      <button
        type="button"
        className="image-gallery-icon image-gallery-fullscreen-button"
        aria-label={isFullscreenMode ? t('closeFullscreen') : t('openFullscreen')}
        onClick={() => {
          if (!isFullscreenMode) {
            prepareGalleryFullscreenLayout();
            onClick();
          } else {
            flushSync(() => {
              setGalleryFsCurtain(true);
            });
            armFsCurtainFallback();
            onClick();
          }
        }}
      >
        <GalleryFullscreenSvg exit={isFullscreenMode} />
      </button>
    ),
    [armFsCurtainFallback, prepareGalleryFullscreenLayout, t],
  );

  const renderGalleryLeftNav = useCallback(
    (onClick: MouseEventHandler<HTMLElement>, disabled: boolean) => (
      <button
        type="button"
        className="image-gallery-icon image-gallery-left-nav"
        disabled={disabled}
        onClick={onClick}
        aria-label={tNavbar('galleryPrev')}
      >
        <GalleryNavSvg direction="left" />
      </button>
    ),
    [tNavbar],
  );

  const renderGalleryRightNav = useCallback(
    (onClick: MouseEventHandler<HTMLElement>, disabled: boolean) => (
      <button
        type="button"
        className="image-gallery-icon image-gallery-right-nav"
        disabled={disabled}
        onClick={onClick}
        aria-label={tNavbar('galleryNext')}
      >
        <GalleryNavSvg direction="right" />
      </button>
    ),
    [tNavbar],
  );

  const imageGalleryItems = useMemo(() => {
    return sortedImages.map((image, slideIndex) => {
      if (image.src.endsWith('.mp4')) {
        return {
          original: image.src,
          thumbnail: image.src,
          renderThumbInner: () => (
            <span className="image-gallery-thumbnail-inner">
              <ProductGalleryVideo key={image.src} src={image.src} variant="thumbnail" />
            </span>
          ),
          renderItem: () => (
            <span className="image-gallery-image-wrap">
              <ProductGalleryVideo
                key={image.src}
                src={image.src}
                variant="slide"
                skeletonBorderRadius={isFullscreenRef.current ? 0 : 16}
                slideStyle={
                  isFullscreenRef.current
                    ? { maxHeight: '100dvh', width: 'auto', maxWidth: '100%', objectFit: 'contain' }
                    : { maxHeight: slideHeight, width: '100%', objectFit: 'cover' }
                }
              />
            </span>
          ),
        };
      }

      return {
        original: image.src,
        thumbnail: image.src,
        originalAlt: imageAlt,
        renderThumbInner: () => (
          <ProductGalleryThumbnailImage src={image.src} alt={imageAlt} />
        ),
        renderItem: () => (
          <ProductGallerySlideImage
            src={image.src}
            alt={imageAlt}
            slideIndex={slideIndex}
            slideHeight={slideHeight}
            slideWidth={slideWidth ?? null}
            isFullscreen={isFullscreenRef.current}
            isMobile={isMobile}
          />
        ),
      };
    });
  }, [sortedImages, imageAlt, slideHeight, slideWidth, isMobile]);

  useMobileGalleryThumbnailScrollGuard({
    galleryRootRef: galleryWrapRef,
    isMobile,
    isFullscreen,
    showThumbnails: sortedImages.length > 0,
    layoutKey: galleryLayoutDependency,
  });

  return (
    <>
      {typeof document !== 'undefined' && galleryFsCurtain
        ? createPortal(<div className={styles.fsCurtain} aria-hidden />, document.body)
        : null}

      <div
        ref={galleryWrapRef}
        className={cn(
          styles.gallery,
          sticky && styles.gallerySticky,
          fullBleedOnMobile && styles.galleryFullBleed,
          galleryFsCurtain && styles.galleryFsCurtain,
          className,
        )}
        style={gallerySurfaceStyle}
        data-gallery-adaptive={galleryBox ? '' : undefined}
      >
        <div
          className={cn(
            styles.galleryMedia,
            imageGalleryItems.length === 0 && styles.galleryMediaPlaceholder,
          )}
        >
          {discountPercent && !isFullscreen ? (
            <span
              className={styles.galleryDiscountBadge}
              style={{ left: galleryBox ? galleryBox.thumbOffset : 12 }}
              aria-label={`−${discountPercent}%`}
            >
              −{discountPercent}%
            </span>
          ) : null}
          {imageGalleryItems.length === 0 ? (
            <div className={styles.galleryPlaceholder} />
          ) : (
            <ImageGallery
              ref={galleryRef}
              additionalClass={cn(styles.galleryInner, 'w-100', { 'd-flex align-items-center justify-content-center': isMobile })}
              showIndex
              items={imageGalleryItems}
              infinite
              showBullets={isMobile}
              showNav={!isMobile}
              showPlayButton={false}
              thumbnailPosition={isMobile ? 'right' : 'left'}
              showThumbnails
              disableThumbnailSwipe={disableThumbnailSwipe}
              slideDuration={gallerySlideDuration}
              useBrowserFullscreen
              renderFullscreenButton={renderGalleryFullscreenButton}
              renderLeftNav={renderGalleryLeftNav}
              renderRightNav={renderGalleryRightNav}
              onSlide={(index) => {
                currentSlideIndexRef.current = index;
                setCurrentSlideIndex(index);
              }}
              onScreenChange={(fullscreen) => {
                if (fullscreen) {
                  const indexToShow = fsTargetIndexRef.current;
                  clearFsCurtainFallback();
                  setGalleryFsCurtain(false);
                  setIsFullscreen(true);
                  setGalleryFullscreenCssVariablesOnDocumentRoot(isMobile);
                  if (isMobile) {
                    applyThumbnailsRightSlideWrapperStylesWhenMobileFullscreen();
                  }
                  jumpGalleryToIndex(indexToShow);
                } else {
                  const indexToRestore = currentSlideIndexRef.current;
                  isFullscreenRef.current = false;
                  clearFsCurtainFallback();
                  setGalleryFsCurtain(false);
                  restoreGalleryAfterFullscreenExit(indexToRestore);
                }
              }}
              onClick={isFullscreen ? undefined : openGalleryFullscreen}
            />
          )}
        </div>

        {showNotice && noticeShellClassName && noticeClassName ? (
          <div className={noticeShellClassName}>
            <div className={noticeClassName} role="note" style={noticeLayoutStyle}>
              {t('notice')}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};
