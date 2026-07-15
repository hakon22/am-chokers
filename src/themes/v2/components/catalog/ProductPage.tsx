import { useCallback, useContext, useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Rate } from 'antd';
import Link from 'next/link';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { Telegram } from 'react-bootstrap-icons';
import moment from 'moment';
import axios from 'axios';
import Carousel from 'react-multi-carousel';
import cn from 'classnames';

import { JsonLd } from '@/components/seo/JsonLd';
import { GradeList } from '@/components/GradeList';
import { V2AdminCreateItem } from '@/themes/v2/components/admin/V2AdminCreateItem';
import { ProductCard } from '@/themes/v2/components/ProductCard';
import { V2CartControl } from '@/themes/v2/components/V2CartControl';
import { V2ProductAdminToolbar } from '@/themes/v2/components/catalog/V2ProductAdminToolbar';
import { V2ProductGallery } from '@/themes/v2/components/catalog/V2ProductGallery';
import { CAROUSEL_MINIMUM_TOUCH_DRAG_PX } from '@/utilities/carouselMinimumTouchDrag';
import { buildBreadcrumbJsonLd, buildProductJsonLd, buildProductSeoDescription } from '@/utilities/structuredData';
import { routes } from '@/routes';
import { useCarouselInteractionAutoplayPause } from '@/hooks/useCarouselInteractionAutoplayPause';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { useTryOn } from '@/hooks/useTryOn';
import { TryOnModal } from '@/components/try-on/TryOnModal';
import { AuthModalContext, ItemContext, MobileContext, SubmitContext } from '@/components/Context';
import { addFavorites, removeFavorites } from '@/slices/userSlice';
import { setPaginationParams } from '@/slices/appSlice';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { buildItemImageAlt } from '@/utilities/buildItemImageAlt';
import {
  buildProductGallerySlideOptimizerUrl,
  SSR_PRODUCT_GALLERY_DESKTOP_VIEWPORT_WIDTH,
  SSR_PRODUCT_GALLERY_DEVICE_PIXEL_RATIO,
  SSR_PRODUCT_GALLERY_MOBILE_VIEWPORT_WIDTH,
} from '@/utilities/buildNextImageOptimizerUrl';
import { getFirstRasterProductImageSrc, getProductGalleryRasterImageSrcs } from '@/utilities/getFirstRasterProductImageSrc';
import { getHref } from '@/utilities/getHref';
import { scrollToElement } from '@/utilities/scrollToElement';
import { isTryOnEnabledForGroup, getTryOnVtoTypeForGroup, resolveHasTryOnImage } from '@/utilities/isTryOnEnabledForGroupCode';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import styles from '@/themes/v2/components/catalog/ProductPage.module.scss';
import productsSectionStyles from '@/themes/v2/components/home/ProductsSection.module.scss';
import { booleanSchema } from '@server/utilities/convertation.params';
import { useV2FooterNearViewport } from '@/hooks/useV2FooterNearViewport';
import { useSeoLanguage, useSeoUserLang } from '@/utilities/resolveSeoLanguage';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface, PaginationInterface } from '@/types/PaginationInterface';
import type { ItemTranslateEntity } from '@server/db/entities/item.translate.entity';

/** cartRow ушёл вверх за viewport — показываем fixed bar */
const CART_ROW_STICKY_BAR_OFFSET = 0;
/** Зона у низа экрана: bar + отступ (mobile — с BottomNav) */
const STICKY_BAR_FOOTER_ZONE_MOBILE = 128;
const STICKY_BAR_FOOTER_ZONE_DESKTOP = 88;

export const ProductPage = ({ item: fetchedItem, paginationParams }: { item: ItemInterface; paginationParams?: PaginationInterface; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tTryOn } = useTranslation('translation', { keyPrefix: 'modules.tryOn' });
  const { t: tSeo } = useTranslation('translation', { keyPrefix: 'seo' });
  const { t: tNavbar } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { t: tDelivery } = useTranslation('translation', { keyPrefix: 'pages.delivery' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();
  const urlParams = useSearchParams();
  const editParams = urlParams.get('edit');
  const { token, favorites, isAdmin } = useAppSelector((state) => state.user);
  const lang = useUserLang();
  const { setIsSubmit } = useContext(SubmitContext);
  const { openAuthModal } = useContext(AuthModalContext);
  const { setItem: setContextItem } = useContext(ItemContext);
  const { isMobile } = useContext(MobileContext);
  const { isAutoplayPausedByInteraction, interactionPauseProps } = useCarouselInteractionAutoplayPause();
  const seoUserLang = useSeoUserLang();
  const languageCode = useSeoLanguage();

  const [item, setItem] = useState(fetchedItem);
  const [isEdit, setEdit] = useState<boolean | undefined>();
  const [relatedGroupItems, setRelatedGroupItems] = useState<ItemInterface[]>([]);
  const [openSection, setOpenSection] = useState<string | null>('description');
  const [qty, setQty] = useState(1);
  const cartRowRef = useRef<HTMLDivElement>(null);
  const cartRowVisibleRef = useRef(true);
  const [cartRowVisible, setCartRowVisible] = useState(true);
  const infoRef = useRef<HTMLDivElement>(null);
  const [infoRect, setInfoRect] = useState<{ left: number; width: number } | null>(null);

  const setItemEffect = useEffectEvent(setItem);
  const setEditEffect = useEffectEvent(setEdit);

  const updateItem = useCallback((value: ItemInterface) => {
    setItem(value);
    setContextItem(value);
  }, [setContextItem]);

  const { id, collection, images, colors, price, discountPrice, compositions, rating } = item;
  const isTryOnEnabled = isTryOnEnabledForGroup(item.group) && resolveHasTryOnImage(item);
  const tryOn = useTryOn({
    itemId: id,
    isEnabled: isTryOnEnabled,
    vtoType: getTryOnVtoTypeForGroup(item.group),
  });

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
    const gallerySlidePreloadViewport = {
      viewportWidth: isMobile
        ? SSR_PRODUCT_GALLERY_MOBILE_VIEWPORT_WIDTH
        : SSR_PRODUCT_GALLERY_DESKTOP_VIEWPORT_WIDTH,
      devicePixelRatio: SSR_PRODUCT_GALLERY_DEVICE_PIXEL_RATIO,
    };
    const gallerySlidePreloadUrls = getProductGalleryRasterImageSrcs(images).map(
      (imageSrc) => buildProductGallerySlideOptimizerUrl(imageSrc, gallerySlidePreloadViewport),
    );

    return {
      seoProductName,
      productFallbackDescription,
      productSeoDescription,
      firstProductImage,
      gallerySlidePreloadUrls,
      productJsonLd: buildProductJsonLd(item, languageCode, productFallbackDescription, paginationParams?.count, item.grades),
      productBreadcrumbJsonLd: buildBreadcrumbJsonLd([
        { name: tNavbar('menu.home'), url: routes.page.base.homePage },
        { name: tNavbar('menu.catalog'), url: routes.page.base.catalog },
        { name: seoGroupName, url: `${routes.page.base.catalog}/${item.group?.code ?? ''}` },
        { name: seoProductName, url: getHref(item) },
      ]),
    };
  }, [seoUserLang, languageCode, item, name, price, discountPrice, images, paginationParams?.count, isMobile, tSeo, tNavbar]);

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

  const footerNearViewport = useV2FooterNearViewport(
    isMobile ? STICKY_BAR_FOOTER_ZONE_MOBILE : STICKY_BAR_FOOTER_ZONE_DESKTOP,
  );
  const isStickyBarVisible = !cartRowVisible && !footerNearViewport;

  useEffect(() => {
    const el = cartRowRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!cartRowVisibleRef.current) {
            cartRowVisibleRef.current = true;
            setCartRowVisible(true);
          }
          return;
        }

        if (entry.boundingClientRect.top < -CART_ROW_STICKY_BAR_OFFSET && cartRowVisibleRef.current) {
          cartRowVisibleRef.current = false;
          setCartRowVisible(false);
        }
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
        preloadImage={productSeoBundle.gallerySlidePreloadUrls[0]}
        preloadImages={productSeoBundle.gallerySlidePreloadUrls}
        jsonLd={[productSeoBundle.productJsonLd, productSeoBundle.productBreadcrumbJsonLd]}
      />

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
          <V2ProductGallery
            images={images}
            imageAlt={imageAlt}
            layoutKey={fetchedItem.id}
            sticky
            fullBleedOnMobile
            showNotice
            noticeShellClassName={styles.noticeShell}
            noticeClassName={styles.notice}
            discountPercent={discountPercent}
            showTryOnImageLabels={isAdmin}
          />
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
            <span className={styles.priceGroup}>
              <span className={styles.priceMain}>
                {t('price', { price: discountPrice ? price - discountPrice : price })}
              </span>
              {discountPrice ? (
                <span className={styles.priceOld}>{t('price', { price })}</span>
              ) : null}
            </span>
            {discountPrice && discountPercent ? (
              <span className={styles.priceBadge}>−{discountPercent}%</span>
            ) : null}
            {/* Mobile: rating inline next to price */}
            <div className={styles.mobileRatingInline}>
              <Rate disabled allowHalf count={isMobile && discountPrice ? 1 : undefined} value={grade} />
              <strong>{grade}</strong>
              <span className={styles.ratingDot}>·</span>
              {gradeCount > 0 ? (
                <button className={styles.ratingLink} onClick={() => scrollToElement('grades', 120)} type="button">
                  {t('grades.gradeCount', { count: gradeCount })}
                </button>
              ) : (
                <span className={styles.ratingEmpty}>{t('grades.gradeCount', { count: 0 })}</span>
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
              {tryOn.isEnabled ? (
                <button
                  type="button"
                  className={styles.btnTryOn}
                  onClick={tryOn.open}
                >
                  <span className={styles.btnTryOnBadge}>{tTryOn('newBadge')}</span>
                  {tTryOn('button')}
                </button>
              ) : null}
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

            {/* Размер */}
            {length && (
              <div className={styles.accItem}>
                <button
                  className={styles.accHeader}
                  onClick={() => toggleSection('others')}
                  type="button"
                  aria-expanded={openSection === 'others'}
                  aria-controls="product-section-others"
                >
                  {t('sizeSection')}
                  <span className={`${styles.accChevron}${openSection === 'others' ? ` ${styles.open}` : ''}`}>▾</span>
                </button>
                <div className={styles.accBody} id="product-section-others" hidden={openSection !== 'others'}>
                  <div className={styles.compositionBlock}>
                    <span>{length}</span>
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
          <div {...interactionPauseProps}>
            <Carousel
              autoPlaySpeed={2500}
              infinite
              autoPlay={!isAutoplayPausedByInteraction}
              pauseOnHover={false}
              shouldResetAutoplay
              showDots={false}
              arrows={false}
              slidesToSlide={1}
              swipeable
              draggable={false}
              minimumTouchDrag={CAROUSEL_MINIMUM_TOUCH_DRAG_PX}
              deviceType={isMobile ? 'mobile' : 'desktop'}
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
        </div>
      )}
      {/* ── Sticky cart bar ── */}
      {!item.deleted && (
        <div
          className={cn(styles.stickyBar, !isStickyBarVisible && styles.stickyBarHidden)}
          style={!isMobile && infoRect ? { left: infoRect.left, width: infoRect.width } as CSSProperties : undefined}
          aria-hidden={!isStickyBarVisible}
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
      {tryOn.isEnabled ? (
        <TryOnModal
          open={tryOn.modalOpen}
          loading={tryOn.loading}
          resultImageSrc={tryOn.resultImageSrc}
          error={tryOn.error}
          rated={tryOn.rated}
          vtoType={tryOn.vtoType}
          onClose={tryOn.close}
          onSubmit={tryOn.submit}
          onRate={tryOn.rate}
        />
      ) : null}
    </>
  );
};
