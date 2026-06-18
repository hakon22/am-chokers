import { useCallback, useContext, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEventHandler } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Rate } from 'antd';
import Link from 'next/link';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { Telegram } from 'react-bootstrap-icons';
import moment from 'moment';
import axios from 'axios';
import ImageGallery, { type ImageGalleryRef } from 'react-image-gallery';
import 'react-image-gallery/styles/image-gallery.css';
import Carousel from 'react-multi-carousel';
import cn from 'classnames';
import { isNil } from 'lodash';

import { JsonLd } from '@/components/seo/JsonLd';
import { GradeList } from '@/components/GradeList';
import { V2AdminCreateItem } from '@/themes/v2/components/admin/V2AdminCreateItem';
import { ProductCard } from '@/themes/v2/components/ProductCard';
import { V2CartControl } from '@/themes/v2/components/V2CartControl';
import { V2ProductAdminToolbar } from '@/themes/v2/components/catalog/V2ProductAdminToolbar';
import { ProductGalleryVideo } from '@/themes/v2/components/catalog/ProductGalleryVideo';
import { ProductGallerySlideImage } from '@/themes/v2/components/catalog/ProductGallerySlideImage';
import { ProductGalleryThumbnailImage } from '@/themes/v2/components/catalog/ProductGalleryThumbnailImage';
import { buildBreadcrumbJsonLd, buildProductJsonLd, buildProductSeoDescription } from '@/utilities/structuredData';
import { routes } from '@/routes';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { AuthModalContext, ItemContext, MobileContext, SubmitContext } from '@/components/Context';
import { addFavorites, removeFavorites } from '@/slices/userSlice';
import { setPaginationParams } from '@/slices/appSlice';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { buildItemImageAlt } from '@/utilities/buildItemImageAlt';
import { getFirstRasterProductImageSrc } from '@/utilities/getFirstRasterProductImageSrc';
import { getHref } from '@/utilities/getHref';
import { scrollToElement } from '@/utilities/scrollToElement';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { sortItemImagesByOrder } from '@/utilities/sortItemImagesByOrder';
import styles from '@/themes/v2/components/catalog/ProductPage.module.scss';
import productsSectionStyles from '@/themes/v2/components/home/ProductsSection.module.scss';
import { booleanSchema } from '@server/utilities/convertation.params';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { useSeoLanguage, useSeoUserLang } from '@/utilities/resolveSeoLanguage';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface, PaginationInterface } from '@/types/PaginationInterface';
import type { ItemTranslateEntity } from '@server/db/entities/item.translate.entity';

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

const setGalleryFullscreenCssVariablesOnDocumentRoot = (isMobile: boolean) => {
  document.documentElement.style.setProperty(
    '--galleryWidth',
    isMobile ? 'calc(100% - 30px)' : 'calc(100% - 110px)',
  );
  document.documentElement.style.setProperty('--galleryHeight', '100vh');
};

const applyThumbnailsRightSlideWrapperStylesWhenMobileFullscreen = () => {
  const thumbnailsRightSlideWrapper = document.querySelector(
    '.image-gallery-slide-wrapper.image-gallery-thumbnails-right',
  ) as HTMLElement | null;
  if (thumbnailsRightSlideWrapper) {
    thumbnailsRightSlideWrapper.style.transition = 'none';
    thumbnailsRightSlideWrapper.style.width = '100%';
  }
};

const restoreThumbnailsRightSlideWrapperStylesAfterMobileFullscreen = () => {
  const thumbnailsRightSlideWrapper = document.querySelector(
    '.image-gallery-slide-wrapper.image-gallery-thumbnails-right',
  ) as HTMLElement | null;
  if (thumbnailsRightSlideWrapper) {
    thumbnailsRightSlideWrapper.style.width = '';
    thumbnailsRightSlideWrapper.style.transition = '';
  }
};

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

export const ProductPage = ({ item: fetchedItem, paginationParams }: { item: ItemInterface; paginationParams?: PaginationInterface; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tSeo } = useTranslation('translation', { keyPrefix: 'seo' });
  const { t: tNavbar } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { t: tDelivery } = useTranslation('translation', { keyPrefix: 'pages.delivery' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();
  const urlParams = useSearchParams();
  const editParams = urlParams.get('edit');
  const { lang = UserLangEnum.RU, token, favorites, isAdmin } = useAppSelector((state) => state.user);
  const { setIsSubmit } = useContext(SubmitContext);
  const { openAuthModal } = useContext(AuthModalContext);
  const { setItem: setContextItem } = useContext(ItemContext);
  const { isMobile } = useContext(MobileContext);
  const seoUserLang = useSeoUserLang();
  const languageCode = useSeoLanguage();

  const galleryRef = useRef<ImageGalleryRef>(null);
  const galleryWrapRef = useRef<HTMLDivElement>(null);
  const [galleryBox, setGalleryBox] = useState<{
    w: number;
    h: number;
    thumbOffset: number;
    /** Ширина основного слайда (getBoundingClientRect относительно обёртки). */
    mainSlideW: number;
  } | null>(null);
  const [item, setItem] = useState(fetchedItem);
  const [isEdit, setEdit] = useState<boolean | undefined>();
  const [relatedGroupItems, setRelatedGroupItems] = useState<ItemInterface[]>([]);
  const [openSection, setOpenSection] = useState<string | null>('description');
  const [qty, setQty] = useState(1);
  /** Как в v1 (`CardItem`): для полноэкрана и :root --gallery* */
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);
  /** Чёрный слой + скрытие контента до `fullscreenchange`, чтобы не мелькала промежуточная вёрстка. */
  const [galleryFsCurtain, setGalleryFsCurtain] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlideIndexRef = useRef(0);
  const [gallerySlideDuration, setGallerySlideDuration] = useState(GALLERY_SLIDE_DURATION_MS);
  const fsTargetIndexRef = useRef(0);
  const fsCurtainFallbackRef = useRef<number | null>(null);
  const restoreGallerySlideDurationRef = useRef<number | null>(null);
  const cartRowRef = useRef<HTMLDivElement>(null);
  const [cartRowVisible, setCartRowVisible] = useState(true);
  const infoRef = useRef<HTMLDivElement>(null);
  const [infoRect, setInfoRect] = useState<{ left: number; width: number } | null>(null);

  const setItemEffect = useEffectEvent(setItem);
  const setEditEffect = useEffectEvent(setEdit);

  const updateItem = useCallback((value: ItemInterface) => {
    setItem(value);
    setContextItem(value);
  }, [setContextItem]);

  const recomputeGalleryBox = useEffectEvent(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const wrap = galleryWrapRef.current;
    if (!wrap || wrap.clientWidth < 8) {
      return;
    }

    const fs = document.fullscreenElement;
    if (fs && wrap.contains(fs)) {
      return;
    }

    const maxH = Math.min(GALLERY_MAX_HEIGHT_CAP, window.innerHeight - GALLERY_VIEWPORT_HEIGHT_RESERVE);
    let maxMainW = Math.min(GALLERY_MAX_MAIN_WIDTH, wrap.clientWidth - GALLERY_THUMB_RAIL - GALLERY_THUMB_GAP);
    if (maxMainW < 160) {
      maxMainW = Math.max(120, wrap.clientWidth - 88);
    }

    let w = maxMainW;
    let h = w * GALLERY_ASPECT_RATIO;
    if (h > maxH) {
      h = maxH;
      w = h / GALLERY_ASPECT_RATIO;
    }

    const slideWrapper = wrap.querySelector('.image-gallery-slide-wrapper') as HTMLElement | null;
    let thumbOffset = GALLERY_THUMB_RAIL + GALLERY_THUMB_GAP;
    let mainSlideW = Math.round(w);

    if (slideWrapper) {
      const wr = wrap.getBoundingClientRect();
      const sr = slideWrapper.getBoundingClientRect();
      thumbOffset = Math.max(0, Math.round(sr.left - wr.left));
      mainSlideW = Math.max(0, Math.round(sr.width));
    }

    setGalleryBox({
      w: Math.round(w),
      h: Math.round(h),
      thumbOffset,
      mainSlideW,
    });
  });

  const { id, collection, images, colors, price, discountPrice, compositions, rating } = item;

  const position = item.translations?.find((translation) => translation.lang === lang) as ItemTranslateEntity | undefined;
  const name = position?.name ?? item.translateName;
  const description = position?.description;
  const length = position?.length;
  const groupName = item.group?.translations?.find((translation) => translation.lang === lang)?.name ?? '';

  const grade = rating?.rating ?? 0;
  const gradeCount = item.grades?.length ?? 0;

  const inFavorites = favorites?.find((fav) => fav.id === id);

  const imageAlt = buildItemImageAlt(item);

  const productSeoBundle = useMemo(() => {
    const seoProductTranslation = item.translations?.find(({ lang }) => lang === seoUserLang) as ItemTranslateEntity | undefined;
    const seoProductName = seoProductTranslation?.name ?? name ?? '';
    const seoGroupName = item.group?.translations?.find(({ lang }) => lang === seoUserLang)?.name ?? '';
    const productFallbackDescription = tSeo('productDescriptionFallback', {
      name: seoProductName,
      price: price - discountPrice,
    });
    const productSeoDescription = buildProductSeoDescription(item, languageCode, productFallbackDescription);
    const firstProductImage = getFirstRasterProductImageSrc(images);

    return {
      seoProductName,
      productFallbackDescription,
      productSeoDescription,
      firstProductImage,
      productJsonLd: buildProductJsonLd(item, languageCode, productFallbackDescription, paginationParams?.count),
      productBreadcrumbJsonLd: buildBreadcrumbJsonLd([
        { name: tNavbar('menu.home'), url: routes.page.base.homePage },
        { name: tNavbar('menu.catalog'), url: routes.page.base.catalog },
        { name: seoGroupName, url: `${routes.page.base.catalog}/${item.group?.code ?? ''}` },
        { name: seoProductName, url: getHref(item) },
      ]),
    };
  }, [seoUserLang, languageCode, item, name, price, discountPrice, images, paginationParams?.count, tSeo, tNavbar]);

  const discountPercent = price && discountPrice
    ? Math.round((discountPrice / price) * 100)
    : null;

  const fetchRelatedGroupItems = useEffectEvent(async () => {
    if (!item.group?.id) {
      return;
    }
    try {
      const { data } = await axios.get<PaginationEntityInterface<ItemInterface>>(routes.item.getList({ isServer: true }), {
        params: { groupIds: [item.group.id], excludeIds: [id] },
      });
      if (data.code === 1) {
        setRelatedGroupItems(data.items);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast);
    }
  });

  useEffect(() => {
    fetchRelatedGroupItems();
  }, [fetchedItem.id, item.group?.id]);

  useEffect(() => {
    if (item.id !== fetchedItem.id) {
      setItemEffect(fetchedItem);
    }
  }, [fetchedItem.id]);

  useEffect(() => {
    requestAnimationFrame(() => {
      galleryRef.current?.slideToIndex?.(0);
    });
  }, [fetchedItem.id]);

  useLayoutEffect(() => {
    recomputeGalleryBox();
  }, [fetchedItem.id]);

  useEffect(() => {
    const wrap = galleryWrapRef.current;
    if (!wrap) {
      return;
    }

    let slideRo: ResizeObserver | null = null;
    const disconnectSlideRo = () => {
      slideRo?.disconnect();
      slideRo = null;
    };

    const attachSlideObserver = () => {
      disconnectSlideRo();
      const slide = wrap.querySelector('.image-gallery-slide-wrapper') as HTMLElement | null;
      if (!slide) {
        return;
      }
      slideRo = new ResizeObserver(() => {
        recomputeGalleryBox();
      });
      slideRo.observe(slide);
    };

    let moRaf = 0;
    const onGalleryDomChange = () => {
      cancelAnimationFrame(moRaf);
      moRaf = requestAnimationFrame(() => {
        attachSlideObserver();
        recomputeGalleryBox();
      });
    };

    // react-image-gallery сдвигает слайд/превью после mount без смены размеров внешней обёртки — RO на wrap не срабатывает
    const mo = new MutationObserver(onGalleryDomChange);
    mo.observe(wrap, { childList: true, subtree: true });

    const roWrap = new ResizeObserver(() => {
      recomputeGalleryBox();
    });
    roWrap.observe(wrap);

    onGalleryDomChange();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        recomputeGalleryBox();
      });
    });

    return () => {
      cancelAnimationFrame(moRaf);
      mo.disconnect();
      roWrap.disconnect();
      disconnectSlideRo();
    };
  }, [fetchedItem.id]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      recomputeGalleryBox();
    });
    return () => cancelAnimationFrame(id);
  }, [currentSlideIndex]);

  const clearFsCurtainFallback = useCallback(() => {
    if (fsCurtainFallbackRef.current != null) {
      clearTimeout(fsCurtainFallbackRef.current);
      fsCurtainFallbackRef.current = null;
    }
  }, []);

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
   * После выхода из fullscreen: миниатюры и размеры слайда, затем синхронизация индекса (без jump — иначе ломается last slide + infinite)
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
        setShowThumbnails(true);
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

  const armFsCurtainFallback = useCallback(() => {
    clearFsCurtainFallback();
    fsCurtainFallbackRef.current = window.setTimeout(() => {
      setGalleryFsCurtain(false);
      fsCurtainFallbackRef.current = null;
    }, 750);
  }, [clearFsCurtainFallback]);

  useEffect(() => {
    const onFsChange = () => {
      clearFsCurtainFallback();
      requestAnimationFrame(() => {
        setGalleryFsCurtain(false);
      });
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
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

  useEffect(() => {
    if (paginationParams) {
      dispatch(setPaginationParams(paginationParams));
    }
  }, [paginationParams]);

  useEffect(() => {
    setContextItem(item);
    return () => { setContextItem(undefined); };
  }, [item.translateName]);

  useEffect(() => {
    if (isAdmin) {
      setEditEffect(booleanSchema.validateSync(editParams));
    }
  }, [editParams, isAdmin]);

  useEffect(() => {
    if (!isAdmin && item.publicationDate) {
      router.push(routes.page.base.homePage);
    }
  }, [item.publicationDate, isAdmin, router]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }
    document.body.classList.add('v2-product-mobile');
    return () => document.body.classList.remove('v2-product-mobile');
  }, [isMobile]);

  useEffect(() => {
    const el = cartRowRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCartRowVisible(true);
        } else if (entry.boundingClientRect.top < 0) {
          // элемент ушёл вверх — пользователь прокрутил ниже кнопки
          setCartRowVisible(false);
        }
        // если элемент ниже viewport — ничего не меняем (страница ещё не дошла до кнопки)
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isMobile) {
      return;
    }
    const el = infoRef.current;
    if (!el) {
      return;
    }
    const update = () => {
      const rect = el.getBoundingClientRect();
      setInfoRect({ left: rect.left, width: rect.width });
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    update();
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [isMobile]);

  const onFavorites = async () => {
    if (!token) {
      openAuthModal?.('login');
      return;
    }
    setIsSubmit(true);
    await dispatch(inFavorites ? removeFavorites(inFavorites.id) : addFavorites(id));
    setIsSubmit(false);
  };

  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

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
   * Отдельные переменные для fullscreen-стилей: иначе при `isFullscreen` перезаписывается `--galleryHeight`
   * и встроенная галерея на странице расползается до входа в browser fullscreen.
   */
  const gallerySurfaceStyle = useMemo((): CSSProperties | undefined => {
    if (isFullscreen) {
      return {
        '--galleryFsHeight': isMobile ? '100svh' : '100dvh',
      } as CSSProperties;
    }
    return galleryCssVars;
  }, [isFullscreen, isMobile, galleryCssVars]);

  /** Десктоп: под слайдом (px). Мобильная: только CSS (.noticeShell + !important), иначе глобальные стили съедают padding. */
  const noticeLayoutStyle = useMemo((): CSSProperties | undefined => {
    if (isMobile) {
      return undefined;
    }
    if (!galleryBox) {
      return undefined;
    }
    return {
      marginLeft: `${galleryBox.thumbOffset}px`,
      width: `${galleryBox.mainSlideW}px`,
      maxWidth: 'none',
      boxSizing: 'border-box',
    };
  }, [galleryBox, isMobile]);

  /** Синхронно до `requestFullscreen`: стили слайда + items; иначе один кадр «ломаной» вёрстки. */
  const prepareGalleryFullscreenLayout = useCallback((): number => {
    const indexToShow = currentSlideIndex;
    fsTargetIndexRef.current = indexToShow;
    isFullscreenRef.current = true;
    flushSync(() => {
      setGallerySlideDuration(0);
      setIsFullscreen(true);
      if (isMobile) {
        setShowThumbnails(false);
      } else {
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

  const openGalleryFullscreen = useCallback(() => {
    if (isFullscreenRef.current) {
      return;
    }
    prepareGalleryFullscreenLayout();
    galleryRef.current?.fullScreen();
  }, [prepareGalleryFullscreenLayout]);

  const renderGalleryFullscreenButton = useCallback(
    (onClick: () => void, fs: boolean) => (
      <button
        type="button"
        className="image-gallery-icon image-gallery-fullscreen-button"
        aria-label={fs ? t('closeFullscreen') : t('openFullscreen')}
        onClick={() => {
          if (!fs) {
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
        <GalleryFullscreenSvg exit={fs} />
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
    return sortItemImagesByOrder(images).map((image, slideIndex) => {
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
                skeletonBorderRadius={isFullscreen ? 0 : 16}
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
            isFullscreen={isFullscreen}
            isMobile={isMobile}
          />
        ),
      };
    });
  }, [images, imageAlt, slideHeight, slideWidth, isFullscreen, isMobile]);

  // Stock status
  const stockState: 'in' | 'out' | 'del' = item.deleted ? 'del' : item.outStock ? 'out' : 'in';
  const stockText = (() => {
    if (item.deleted) {
      return tCart('deleted');
    }
    if (item.outStock) {
      return t('sendFrom', { date: moment(item.outStock).format(DateFormatEnum.DD_MM) });
    }
    return t('inStock');
  })();

  if (isAdmin && isEdit) {
    return <V2AdminCreateItem oldItem={item} updateItem={updateItem} />;
  }

  if (!isAdmin && item.publicationDate) {
    return null;
  }

  return (
    <>
      <JsonLd
        title={productSeoBundle.seoProductName}
        description={productSeoBundle.productSeoDescription || productSeoBundle.productFallbackDescription}
        image={productSeoBundle.firstProductImage}
        imageAlt={imageAlt}
        type="product"
        preloadImage={productSeoBundle.firstProductImage}
        jsonLd={[productSeoBundle.productJsonLd, productSeoBundle.productBreadcrumbJsonLd]}
      />

      {typeof document !== 'undefined' && galleryFsCurtain
        ? createPortal(<div className={styles.fsCurtain} aria-hidden />, document.body)
        : null}

      <div className={styles.product}>

        {/* ── Mobile title (shown before gallery on mobile only) ── */}
        <div className={styles.mobileTitle}>
          <h1 className={styles.infoName} aria-hidden={!isMobile}>{name}</h1>
          {collection && (
            <Link
              href={`${routes.page.base.catalog}?collectionIds=${collection.id}`}
              className={styles.mobileTitleCollection}
            >
              {collection.translations?.find((translation) => translation.lang === lang)?.name ?? ''}
            </Link>
          )}
        </div>

        {/* ── Gallery ── */}
        <div className={styles.galleryCol}>
          <div
            ref={galleryWrapRef}
            className={cn(styles.gallery, galleryFsCurtain && styles.galleryFsCurtain)}
            style={gallerySurfaceStyle}
            data-gallery-adaptive={galleryBox ? '' : undefined}
          >
            <div
              className={cn(
                styles.galleryMedia,
                imageGalleryItems.length === 0 && styles.galleryMediaPlaceholder,
              )}
            >
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
                  showThumbnails={showThumbnails}
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
                        setShowThumbnails(false);
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
            <div className={styles.noticeShell}>
              <div className={styles.notice} role="note" style={noticeLayoutStyle}>
                {t('notice')}
              </div>
            </div>
          </div>
        </div>{/* /galleryCol */}

        {/* ── Info panel ── */}
        <div className={styles.info} ref={infoRef}>

          {/* Eyebrow */}
          {groupName && <div className={styles.infoEyebrow}>{groupName}</div>}

          {/* Collection (desktop) */}
          {collection && (
            <Link
              href={`${routes.page.base.catalog}?collectionIds=${collection.id}`}
              className={styles.infoCollection}
            >
              {collection.translations?.find((translation) => translation.lang === lang)?.name ?? ''}
            </Link>
          )}

          {/* Name */}
          <h1 className={styles.infoName} aria-hidden={isMobile}>{name}</h1>

          {/* Rating */}
          <div className={styles.ratingRow}>
            <Rate disabled allowHalf value={grade} />
            <strong style={{ fontSize: 13, color: '#2B3C5F' }}>{grade}</strong>
            <span className={styles.ratingDot}>·</span>
            {gradeCount > 0 ? (
              <button className={styles.ratingLink} onClick={() => scrollToElement('grades', 120)} type="button">
                {t('grades.gradeCount', { count: gradeCount })}
              </button>
            ) : (
              <span style={{ color: '#A1B3CD', fontSize: 12 }}>{t('grades.gradeCount', { count: 0 })}</span>
            )}
          </div>

          {/* Price */}
          <div className={styles.priceRow}>
            <span className={styles.priceMain}>
              {t('price', { price: discountPrice ? price - discountPrice : price })}
            </span>
            {discountPrice ? (
              <>
                <span className={styles.priceOld}>{t('price', { price })}</span>
                {discountPercent && <span className={styles.priceBadge}>−{discountPercent}%</span>}
              </>
            ) : null}
            {/* Mobile: rating inline next to price */}
            <div className={styles.mobileRatingInline}>
              <Rate disabled allowHalf value={grade} style={{ fontSize: 11 }} />
              <strong style={{ fontSize: 12, color: '#2B3C5F' }}>{grade}</strong>
              <span className={styles.ratingDot}>·</span>
              {gradeCount > 0 ? (
                <button className={styles.ratingLink} onClick={() => scrollToElement('grades', 120)} type="button">
                  {t('grades.gradeCount', { count: gradeCount })}
                </button>
              ) : (
                <span style={{ color: '#A1B3CD', fontSize: 12 }}>{t('grades.gradeCount', { count: 0 })}</span>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className={styles.stockRow}>
            <span className={`${styles.stockDot} ${styles[stockState]}`} />
            <span className={`${styles.stockText} ${styles[stockState]}`}>{stockText}</span>
          </div>

          {isAdmin ? <V2ProductAdminToolbar item={item} setItem={updateItem} /> : null}

          <hr className={styles.sep} />

          {/* Qty + Cart */}
          {!item.deleted && (
            <>
              {!item.outStock && <div className={styles.qtyLabel}>{t('quantity')}</div>}
              <div className={styles.cartRow} ref={cartRowRef}>
                <V2CartControl
                  variant="page"
                  itemId={id}
                  qty={qty}
                  onQtyChange={setQty}
                  inCartLabel={t('inCartLabel')}
                  addLabel={t('addToCart')}
                  removeAriaLabel={t('remove')}
                  addAriaLabel={t('add')}
                />
                <button
                  className={`${styles.btnFav}${inFavorites ? ` ${styles.active}` : ''}`}
                  onClick={onFavorites}
                  type="button"
                  aria-label={t('favorites')}
                >
                  {inFavorites ? <HeartFilled /> : <HeartOutlined />}
                </button>
              </div>
            </>
          )}

          {/* Action row */}
          <div className={styles.actionRow}>
            <a className={styles.actionLink} href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank" rel="noopener noreferrer">
              <Telegram /> {t('askQuestion')}
            </a>
            <button
              type="button"
              className={styles.actionLink}
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: name ?? '', url });
                } else {
                  navigator.clipboard.writeText(url);
                }
              }}
            >
              <span>↗</span> {t('shareBtn')}
            </button>
          </div>

          {/* Accordion */}
          <div className={styles.accordion}>

            {/* Описание */}
            {description && (
              <section className={styles.accItem} aria-label={t('descriptionSection')}>
                <button
                  className={styles.accHeader}
                  onClick={() => toggleSection('description')}
                  type="button"
                  aria-expanded={openSection === 'description'}
                  aria-controls="product-section-description"
                >
                  {t('descriptionSection')}
                  <span className={`${styles.accChevron}${openSection === 'description' ? ` ${styles.open}` : ''}`}>▾</span>
                </button>
                <div className={styles.accBody} id="product-section-description" hidden={openSection !== 'description'}>
                  <p>{description}</p>
                </div>
              </section>
            )}

            {/* Материалы и состав */}
            {compositions?.length > 0 && (
              <div className={styles.accItem}>
                <button
                  className={styles.accHeader}
                  onClick={() => toggleSection('materials')}
                  type="button"
                  aria-expanded={openSection === 'materials'}
                  aria-controls="product-section-materials"
                >
                  {t('materialsSection')}
                  <span className={`${styles.accChevron}${openSection === 'materials' ? ` ${styles.open}` : ''}`}>▾</span>
                </button>
                <div className={styles.accBody} id="product-section-materials" hidden={openSection !== 'materials'}>
                  <div className={styles.compositionBlock}>
                    <ul>
                      {compositions.map((comp) => (
                        <li key={comp.id}>
                          {comp.translations?.find((translation) => translation.lang === lang)?.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Цвета */}
            {colors?.length > 0 && (
              <div className={styles.accItem}>
                <button
                  className={styles.accHeader}
                  onClick={() => toggleSection('colors')}
                  type="button"
                  aria-expanded={openSection === 'colors'}
                  aria-controls="product-section-colors"
                >
                  {t('colorsSection')}
                  <span className={`${styles.accChevron}${openSection === 'colors' ? ` ${styles.open}` : ''}`}>▾</span>
                </button>
                <div className={styles.accBody} id="product-section-colors" hidden={openSection !== 'colors'}>
                  <div className={styles.colorRow}>
                    {colors.map((color) => (
                      <div key={color.id} className={styles.colorItem}>
                        <span className={styles.colorDot} style={{ backgroundColor: color.hex }} />
                        <span>{color.translations?.find((translation) => translation.lang === lang)?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Другое */}
            {length && (
              <div className={styles.accItem}>
                <button
                  className={styles.accHeader}
                  onClick={() => toggleSection('others')}
                  type="button"
                  aria-expanded={openSection === 'others'}
                  aria-controls="product-section-others"
                >
                  {t('othersSection')}
                  <span className={`${styles.accChevron}${openSection === 'others' ? ` ${styles.open}` : ''}`}>▾</span>
                </button>
                <div className={styles.accBody} id="product-section-others" hidden={openSection !== 'others'}>
                  <div className={styles.compositionBlock}>
                    <div>
                      <div className={styles.compositionLabel}>{t('length')}</div>
                      <span>{length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Гарантия и уход */}
            <div className={styles.accItem}>
              <button
                className={styles.accHeader}
                onClick={() => toggleSection('warranty')}
                type="button"
                aria-expanded={openSection === 'warranty'}
                aria-controls="product-section-warranty"
              >
                {t('warrantyAndCare')}
                <span className={`${styles.accChevron}${openSection === 'warranty' ? ` ${styles.open}` : ''}`}>▾</span>
              </button>
              <div className={styles.accBody} id="product-section-warranty" hidden={openSection !== 'warranty'}>
                <div className={styles.warrantyText}>
                  <p>{t('warranty.1')}</p>
                  <p>
                    {t('warranty.2')}<br />
                    {t('warranty.3')}<br />
                    {t('warranty.4')}
                  </p>
                  <p><b>{t('warranty.5')}</b></p>
                  <p>
                    {t('warranty.6')}<br />
                    {t('warranty.7')}<br />
                    {t('warranty.8')}<br />
                    {t('warranty.9')}<br />
                    {t('warranty.10')}
                  </p>
                  <p>
                    {t('warranty.11')}
                    <b>
                      <Link href={routes.page.base.jewelryCarePage} title={t('warranty.12')}>
                        {t('warranty.12')}
                      </Link>
                    </b>.
                  </p>
                  <p>
                    {t('warranty.13')}
                    {' '}
                    <Link href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_MAIL}`} target="_blank">
                      <b>{process.env.NEXT_PUBLIC_CONTACT_MAIL}</b>
                    </Link>
                    {' '}
                    {t('warranty.14')}
                    {' '}
                    <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank">
                      <b>@KS_Mary</b>
                    </Link>.
                    <br />{t('warranty.15')}
                    <br />{t('warranty.16')}
                    <br />{t('warranty.17')}
                  </p>
                </div>
              </div>
            </div>

            {/* Доставка и оплата */}
            <div className={styles.accItem}>
              <button
                className={styles.accHeader}
                onClick={() => toggleSection('delivery')}
                type="button"
                aria-expanded={openSection === 'delivery'}
                aria-controls="product-section-delivery"
              >
                {t('deliveryAndPayment')}
                <span className={`${styles.accChevron}${openSection === 'delivery' ? ` ${styles.open}` : ''}`}>▾</span>
              </button>
              <div className={styles.accBody} id="product-section-delivery" hidden={openSection !== 'delivery'}>
                <div className={styles.deliveryText}>
                  <p><b>{tDelivery('delivery')}</b></p>
                  <p>{tDelivery('1')}</p>
                  <p>{tDelivery('2')}</p>
                  <p>
                    {tDelivery('3')}<br />
                    {tDelivery('4')}
                  </p>
                  <p>
                    {tDelivery('5')}
                    <Link href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_MAIL}`} target="_blank">
                      <b>{process.env.NEXT_PUBLIC_CONTACT_MAIL}</b>
                    </Link>
                    {tDelivery('6')}
                    <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank">
                      <b>@KS_Mary</b>
                    </Link>
                    {tDelivery('7')}<br />
                    {tDelivery('8')}
                  </p>
                  <p>{tDelivery('9')}</p>
                  <p><b>{tDelivery('10')}</b></p>
                  <p>
                    {tDelivery('11')}<br />
                    {tDelivery('12')}
                  </p>
                </div>
              </div>
            </div>

          </div>{/* /accordion */}

        </div>{/* /info */}
      </div>{/* /product */}

      {/* ── Reviews ── */}
      <section id="grades" className={cn(styles.section, styles.gradesSection)}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>{t('reviewsEyebrow')}</div>
        </div>
        <GradeList item={item} setItem={setItem} />
      </section>

      {/* ── Related items ── */}
      {relatedGroupItems.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>{t('relatedEyebrow')}</div>
          </div>
          <Carousel
            autoPlaySpeed={2500}
            infinite
            autoPlay
            pauseOnHover
            shouldResetAutoplay
            showDots={false}
            arrows={false}
            slidesToSlide={1}
            swipeable
            draggable={false}
            itemClass={productsSectionStyles.carouselItem}
            containerClass={productsSectionStyles.carouselContainer}
            partialVisible
            responsive={{
              desktop: { breakpoint: { max: 5000, min: 1200 }, items: 4, partialVisibilityGutter: 40 },
              tablet:  { breakpoint: { max: 1199, min: 768 },  items: 3, partialVisibilityGutter: 30 },
              mobile:  { breakpoint: { max: 767,  min: 0 },    items: 2, partialVisibilityGutter: 20 },
            }}
          >
            {relatedGroupItems.map((relatedItem) => (
              <ProductCard
                key={relatedItem.id}
                item={relatedItem}
                rating={{ rating: relatedItem.rating, grades: relatedItem.grades }}
                outStock={relatedItem.outStock ?? undefined}
              />
            ))}
          </Carousel>
        </div>
      )}
      {/* ── Sticky cart bar ── */}
      {!item.deleted && !cartRowVisible && (
        <div
          className={styles.stickyBar}
          style={!isMobile && infoRect ? { left: infoRect.left, width: infoRect.width } as CSSProperties : undefined}
        >
          <V2CartControl
            variant="page"
            itemId={id}
            qty={qty}
            onQtyChange={setQty}
            inCartLabel={t('inCartLabel')}
            addLabel={t('addToCart')}
            removeAriaLabel={t('remove')}
            addAriaLabel={t('add')}
          />
          <button
            className={`${styles.btnFav}${inFavorites ? ` ${styles.active}` : ''}`}
            onClick={onFavorites}
            type="button"
            aria-label={t('favorites')}
          >
            {inFavorites ? <HeartFilled /> : <HeartOutlined />}
          </button>
        </div>
      )}
    </>
  );
};
