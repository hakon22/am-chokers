import { useTranslation } from 'react-i18next';
import { Button, Rate, Tag } from 'antd';
import { LikeOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState, useContext, useEffectEvent } from 'react';
import ImageGallery, { type ImageGalleryRef } from 'react-image-gallery';
import 'react-image-gallery/styles/image-gallery.css';
import Image from 'next/image';
import Link from 'next/link';
import cn from 'classnames';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import moment from 'moment';
import Carousel from 'react-multi-carousel';
import axios from 'axios';

import { Favorites } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';
import { GradeList } from '@/components/GradeList';
import { ItemAdminToolbarV1 } from '@/components/item-admin/ItemAdminToolbarV1';
import { setPaginationParams } from '@/slices/appSlice';
import { routes } from '@/routes';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import CreateItem from '@/pages/admin/item';
import { booleanSchema } from '@server/utilities/convertation.params';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, buildProductJsonLd, buildProductSeoDescription } from '@/utilities/structuredData';
import { useSeoLanguage, useSeoUserLang } from '@/utilities/resolveSeoLanguage';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { ItemContext, MobileContext } from '@/components/Context';
import { useMobileGalleryThumbnailScrollGuard } from '@/hooks/useMobileGalleryThumbnailScrollGuard';
import { getHeight } from '@/utilities/screenExtension';
import { shouldDisableMobileThumbnailSwipe } from '@/utilities/galleryMobileThumbnails';
import { scrollToElement } from '@/utilities/scrollToElement';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { buildItemImageAlt } from '@/utilities/buildItemImageAlt';
import { getFirstRasterProductImageSrc } from '@/utilities/getFirstRasterProductImageSrc';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface, PaginationInterface } from '@/types/PaginationInterface';
import type { ItemTranslateEntity } from '@server/db/entities/item.translate.entity';

export const CardItem = ({ item: fetchedItem, paginationParams }: { item: ItemInterface; paginationParams?: PaginationInterface; }) => {
  const { id, collection, images, colors, price, discountPrice, compositions, rating, ...rest } = fetchedItem;

  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tNavbar } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { t: tSeo } = useTranslation('translation', { keyPrefix: 'seo' });
  const { t: tDelivery } = useTranslation('translation', { keyPrefix: 'pages.delivery' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const galleryRef = useRef<ImageGalleryRef>(null);
  const galleryWrapRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const dispatch = useAppDispatch();

  const { isAdmin } = useAppSelector((state) => state.user);
  const lang = useUserLang();
  const { cart } = useAppSelector((state) => state.cart);
  const { pagination } = useAppSelector((state) => state.app);

  const position = rest.translations.find((translation) => translation.lang === lang) as ItemTranslateEntity;

  const name = position?.name;
  const description = position?.description;
  const length = position?.length;

  const coefficient = 1.3;

  const width = 150;
  const height = width * coefficient;

  const urlParams = useSearchParams();
  const editParams = urlParams.get('edit');

  const grade = rating?.rating ?? 0;

  const { setItem: setContextItem } = useContext(ItemContext);
  const { isMobile } = useContext(MobileContext);

  const [item, setItem] = useState(fetchedItem);
  const [relatedGroupItems, setRelatedGroupItems] = useState<ItemInterface[]>([]);
  const [tab, setTab] = useState<'delivery' | 'warranty'>();
  const [isEdit, setEdit] = useState<boolean | undefined>();
  const [originalHeight, setOriginalHeight] = useState(416);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window === 'undefined' ? 1200 : window.innerWidth
  ));

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const disableThumbnailSwipe = useMemo(
    () => shouldDisableMobileThumbnailSwipe({
      isMobile,
      imageCount: images.length,
      galleryHeightPx: originalHeight,
      viewportWidth,
    }),
    [isMobile, images.length, originalHeight, viewportWidth],
  );

  useMobileGalleryThumbnailScrollGuard({
    galleryRootRef: galleryWrapRef,
    isMobile,
    isFullscreen,
    showThumbnails,
    layoutKey: images.length,
  });

  const imageAlt = buildItemImageAlt(item);

  const imageGalleryItems = useMemo(
    () =>
      [...images].sort((a, b) => a.order - b.order).map((image, slideIndex) => {
        const slideWidth = originalHeight / 1.3;

        if (image.src.endsWith('.mp4')) {
          return {
            original: image.src,
            renderThumbInner: () => (
              <video
                className="w-100"
                autoPlay
                loop
                muted
                playsInline
                src={image.src}
              />
            ),
            thumbnail: image.src,
            renderItem: () => (
              <video
                className="image-gallery-image"
                style={!isFullscreen ? { maxHeight: originalHeight, width: '100%' } : { maxHeight: '100vh' }}
                autoPlay
                loop
                muted
                playsInline
                src={image.src}
              />
            ),
          };
        }

        return {
          original: image.src,
          thumbnail: image.src,
          originalAlt: imageAlt,
          renderItem: () => (
            <Image
              src={image.src}
              alt={imageAlt}
              className="image-gallery-image"
              width={Math.round(slideWidth)}
              height={originalHeight}
              priority={slideIndex === 0}
              sizes="(max-width: 768px) 100vw, 420px"
              style={!isFullscreen ? { maxHeight: originalHeight, width: '100%', objectFit: 'cover' } : { maxHeight: '100vh', width: '100%', objectFit: 'contain' }}
            />
          ),
        };
      }),
    [images, imageAlt, isMobile, originalHeight, isFullscreen],
  );

  const setItemEffect = useEffectEvent(setItem);
  const setEditEffect = useEffectEvent(setEdit);

  const inCart = cart.find((cartItem) => cartItem.item.id === item.id);

  const responsive = {
    desktop: {
      breakpoint: { max: 5000, min: 1400 },
      items: 5,
      partialVisibilityGutter: 50,
    },
    middleDesktop: {
      breakpoint: { max: 1400, min: 1200 },
      items: 6,
      partialVisibilityGutter: 5,
    },
    largeTv: {
      breakpoint: { max: 1200, min: 991 },
      items: 5,
      partialVisibilityGutter: 10,
    },
    tv: {
      breakpoint: { max: 991, min: 800 },
      items: 4,
      partialVisibilityGutter: 5,
    },
    largeTablet: {
      breakpoint: { max: 800, min: 767 },
      items: 3,
      partialVisibilityGutter: 50,
    },
    middleTablet: {
      breakpoint: { max: 767, min: 700 },
      items: 3,
      partialVisibilityGutter: 2,
    },
    tablet: {
      breakpoint: { max: 700, min: 520 },
      items: 2,
      partialVisibilityGutter: 75,
    },
    largeMobile: {
      breakpoint: { max: 520, min: 450 },
      items: 2,
      partialVisibilityGutter: 30,
    },
    mobile: {
      breakpoint: { max: 450, min: 0 },
      items: 2,
      partialVisibilityGutter: 3,
    },
  };

  const updateItem = (value: ItemInterface) => {
    setItem(value);
    setContextItem(value);
  };

  const fetchRelatedGroupItems = useEffectEvent(async () => {
    if (!item.group?.id) {
      return;
    }
    try {
      const { data } = await axios.get<PaginationEntityInterface<ItemInterface>>(routes.item.getList({ isServer: true }), {
        params: {
          groupIds: [item.group.id],
          excludeIds: [item.id],
        },
      });
      if (data.code === 1) {
        setRelatedGroupItems(data.items);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast);
    }
  });

  useEffect(() => {
    if (isAdmin) {
      setEditEffect(booleanSchema.validateSync(editParams));
    }
  }, [editParams, isAdmin]);

  useEffect(() => {
    if (paginationParams) {
      dispatch(setPaginationParams(paginationParams));
    }
  }, [paginationParams]);

  useEffect(() => {
    if (item.id !== id) {
      setItemEffect(fetchedItem);
    }
  }, [id]);

  useEffect(() => {
    setContextItem(item);

    return () => {
      setContextItem(undefined);
    };
  }, [item.translateName]);

  useEffect(() => {
    if (!isAdmin && item.publicationDate) {
      router.push(routes.page.base.homePage);
    }
  }, [item.publicationDate]);

  useEffect(() => {
    fetchRelatedGroupItems();
  }, [id, item.group?.id]);

  const seoUserLang = useSeoUserLang();
  const languageCode = useSeoLanguage();
  const seoProductTranslation = item.translations.find((translation) => translation.lang === seoUserLang) as ItemTranslateEntity | undefined;
  const seoProductName = seoProductTranslation?.name ?? name ?? '';
  const seoGroupName = item.group?.translations?.find((translation) => translation.lang === seoUserLang)?.name ?? '';
  const productFallbackDescription = tSeo('productDescriptionFallback', {
    name: seoProductName,
    price: price - discountPrice,
  });
  const productSeoDescription = buildProductSeoDescription(item, languageCode, productFallbackDescription);
  const firstProductImage = getFirstRasterProductImageSrc(images);
  const productJsonLd = buildProductJsonLd(item, languageCode, productFallbackDescription, paginationParams?.count, item.grades);
  const productBreadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: tNavbar('menu.home'), url: routes.page.base.homePage },
    { name: tNavbar('menu.catalog'), url: routes.page.base.catalog },
    { name: seoGroupName, url: `${routes.page.base.catalog}/${item.group?.code ?? ''}` },
    { name: seoProductName, url: getHref(item) },
  ]);

  return isEdit ? <CreateItem oldItem={item} updateItem={updateItem} />: !isAdmin && item.publicationDate ? null : (
    <div className="d-flex flex-column" style={isMobile ? { marginTop: '100px' } : {}}>
      <JsonLd
        title={seoProductName}
        description={productSeoDescription || productFallbackDescription}
        image={firstProductImage}
        imageAlt={imageAlt}
        type="product"
        preloadImage={firstProductImage}
        jsonLd={[productJsonLd, productBreadcrumbJsonLd]}
      />
      <div className="d-flex flex-column flex-xl-row justify-content-xl-between justify-content-xxl-start gap-xxl-5 mb-5">
        {isMobile
          ? (
            <div className="d-flex flex-column align-items-md-center">
              <h1 className="mb-4 fs-3">{name}</h1>
              <div className="d-flex mb-4 gap-2">
                {collection
                  ? (
                    <Link href={`${routes.page.base.catalog}?collectionIds=${collection.id}`} style={{ width: 'min-content' }}>
                      <Tag color="#3b6099" variant="filled" className="py-1 px-2 fs-6" style={{ backgroundColor: '#eaeef6' }}>{t('collection', { name: collection.translations.find((translation) => translation.lang === lang)?.name })}</Tag>
                    </Link>
                  )
                  : null}
                {(item.deleted || item.outStock) && (
                  <Tag {...(item.deleted ? { color: 'volcano' } : { style: { backgroundColor: '#74b6d5', color: 'white' } })} variant="filled" className="py-1 px-2 fs-6">
                    {tCart(item.deleted ? 'deleted' : 'isAbsent', { date: moment(item.outStock).format(DateFormatEnum.DD_MM) })}
                  </Tag>
                )}
              </div>
            </div>
          )
          : null}
        <div ref={galleryWrapRef} className="d-flex flex-column align-items-center gap-2">
          <ImageGallery
            ref={galleryRef}
            additionalClass={cn('w-100 mb-2 mb-xl-0 mt-xl-2-5', { 'd-flex align-items-center justify-content-center': isMobile })}
            showIndex
            items={imageGalleryItems}
            infinite
            showBullets={isMobile}
            showNav={!isMobile}
            onSlide={(index) => setCurrentSlideIndex(index)}
            onScreenChange={(fullscreen) => {
              if (fullscreen) {
                const indexToShow = currentSlideIndex;
                setIsFullscreen(true);
                setOriginalHeight(getHeight());
                document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 110px)');
                document.documentElement.style.setProperty('--galleryHeight', '100vh');
                if (isMobile) {
                  const div = document.querySelector('.image-gallery-slide-wrapper.image-gallery-thumbnails-right') as HTMLElement;
                  if (div) {
                    div.style.transition = '0.25s all';
                    div.style.width = 'calc(100% - 30px)';
                  }
                  document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 30px)');
                  setShowThumbnails(false);
                }
                requestAnimationFrame(() => {
                  galleryRef.current?.slideToIndex?.(indexToShow);
                });
              } else {
                const indexToRestore = currentSlideIndex;
                setIsFullscreen(false);
                setOriginalHeight(416);
                document.documentElement.style.setProperty('--galleryWidth', '320px');
                document.documentElement.style.setProperty('--galleryHeight', '416px');
                if (isMobile) {
                  const div = document.querySelector('.image-gallery-slide-wrapper.image-gallery-thumbnails-right') as HTMLElement;
                  if (div) {
                    div.style.width = '';
                    div.style.transition = '';
                  }
                  document.documentElement.style.setProperty('--galleryWidth', '320px');
                  setShowThumbnails(true);
                }
                requestAnimationFrame(() => {
                  galleryRef.current?.slideToIndex?.(indexToRestore);
                });
              }
            }}
            showThumbnails={showThumbnails}
            showPlayButton={false}
            thumbnailPosition={isMobile ? 'right' : 'left'}
            disableThumbnailSwipe={disableThumbnailSwipe}
            onClick={() => galleryRef.current?.fullScreen()}
          />
          {!isMobile
            ? (
              <div className="d-flex flex-column justify-content-center" style={{ width: '320px', alignSelf: 'end' }}>
                <p style={{ color: '#3b6099' }}>
                  {t('notice')}
                </p>
                <div className="d-flex justify-content-between w-100">
                  <Button type="text" onClick={() => setTab('warranty')} className={cn('text-muted fs-6 fs-xxl-5 py-3-5 py-xxl-4 px-3 px-xxl-3', { disabled: tab === 'delivery' })}>{t('warrantyAndCare')}</Button>
                  <Button type="text" onClick={() => setTab('delivery')} className={cn('text-muted fs-6 fs-xxl-5 py-3-5 py-xxl-4 px-3 px-xxl-3', { disabled: tab === 'warranty' })}>{t('deliveryAndPayment')}</Button>
                </div>
              </div>
            ) : null}
        </div>
        {isMobile
          ? (
            <p style={{ color: '#3b6099' }}>
              {t('notice')}
            </p>
          ) : null}
        <div style={{ width: isMobile ? '100%' : '60%' }}>
          <div className="d-flex flex-column">
            {!isMobile
              ? (
                <>
                  <h1 className="mb-4 mt-xl-0 fs-3">{name}</h1>
                  <div className="d-flex mb-4 gap-2">
                    {collection
                      ? (
                        <Link href={`${routes.page.base.catalog}?collectionIds=${collection.id}`} style={{ width: 'min-content' }}>
                          <Tag color="#3b6099" variant="filled" className="py-1 px-2 fs-6" style={{ backgroundColor: '#eaeef6' }}>{t('collection', { name: collection.translations.find((translation) => translation.lang === lang)?.name })}</Tag>
                        </Link>
                      )
                      : null}
                    {(item.deleted || item.outStock) && (
                      <Tag {...(item.deleted ? { color: 'volcano' } : { style: { backgroundColor: '#74b6d5', color: 'white' } })} variant="filled" className="py-1 px-2 fs-6">
                        {tCart(item.deleted ? 'deleted' : 'isAbsent', { date: moment(item.outStock).format(DateFormatEnum.DD_MM) })}
                      </Tag>
                    )}
                  </div>
                </>)
              : null}
            <div className={cn('d-flex align-items-center gap-4 mb-4', { 'order-1': isMobile })}>
              <div className="d-flex align-items-center gap-2" title={grade.toString()}>
                <Rate disabled allowHalf value={grade} />
                <span>{grade}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <LikeOutlined />
                {pagination.count
                  ? (
                    <button
                      className="icon-button text-muted"
                      style={{ color: '#393644' }}
                      type="button"
                      title={t('grades.gradeCount', { count: pagination.count })}
                      onClick={() => scrollToElement('grades', 120)}
                    >
                      {t('grades.gradeCount', { count: pagination.count })}
                    </button>
                  )
                  : <span>{t('grades.gradeCount', { count: pagination.count })}</span>}
              </div>
            </div>
            <div className={cn('d-flex gap-5 mb-4', { 'order-0': isMobile })}>
              <div className="d-flex gap-3">
                {discountPrice ? <p className="fs-5 m-0">{t('price', { price: price - discountPrice })}</p> : null}
                <p className={cn('fs-5 m-0', { 'text-muted text-decoration-line-through fw-light': discountPrice })}>{t('price', { price })}</p>
              </div>
              {isMobile ? <Favorites id={id} /> : null}
              <ItemAdminToolbarV1 item={item} setItem={updateItem} />
            </div>
            {isMobile
              ? showThumbnails
                ? (
                  <div className="float-control-cart d-flex align-items-center justify-content-center gap-5" style={{ backgroundColor: inCart ? '#eaeef6' : '#2b3c5f', ...(inCart ? { border: '1px solid #c8c8c8' } : {}) }}>
                    <CartControl id={id} className="fs-5" classNameButton="w-100 h-100" />
                  </div>
                ) : null
              : (
                <div className="d-flex align-items-center gap-5 mb-3">
                  <CartControl id={id} className="fs-5" />
                  <Favorites id={id} />
                </div>
              )}
            <p className={cn('lh-lg', { 'order-2': isMobile })} style={{ letterSpacing: '0.5px' }}>{description}</p>
            <div className={cn('d-flex flex-column gap-3', { 'order-3': isMobile })}>
              <div className="d-flex flex-column gap-2">
                <span className="fs-5">{t('composition')}</span>
                <span>{compositions.map((composition) => composition.translations.find((translation) => translation.lang === lang)?.name).join(', ')}</span>
              </div>
              <div className="d-flex flex-column gap-2">
                <span className="fs-5">{t('color')}</span>
                <div className="d-flex gap-3 flex-wrap">
                  {colors.map((color) => (
                    <div key={color.id} className="d-flex align-items-center gap-2">
                      <span className="d-block" style={{ backgroundColor: color.hex, borderRadius: '50%', width: 25, height: 25 }} />
                      <span>{color.translations.find((translation) => translation.lang === lang)?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="d-flex flex-column gap-2">
                <span className="fs-5">{t('length')}</span>
                <span>{length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end mb-3 mb-xl-5">
        <div className="col-11 d-flex flex-column justify-content-end">
          <div className="warranty-fade" hidden={tab !== 'warranty'}>
            <p>{t('warranty.1')}</p>
            <div>
              {t('warranty.2')}
              <br />
              {t('warranty.3')}
              <br />
              {t('warranty.4')}
              <br />
            </div>
            <p className="my-4 fs-5 fw-bold">{t('warranty.5')}</p>
            <div>
              {t('warranty.6')}
              <br />
              {t('warranty.7')}
              <br />
              {t('warranty.8')}
              <br />
              {t('warranty.9')}
              <br />
              {t('warranty.10')}
              <br />
            </div>
            <p className="my-4">
              {t('warranty.11')}
              <b><Link href={routes.page.base.jewelryCarePage} title={t('warranty.12')}>{t('warranty.12')}</Link></b>
              .
            </p>
            <div>
              {t('warranty.13')}
              {' '}
              <Link href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_MAIL}`} target="_blank" className="fw-bold">{process.env.NEXT_PUBLIC_CONTACT_MAIL}</Link>
              {' '}
              {t('warranty.14')}
              {' '}
              <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank" className="fw-bold">@KS_Mary</Link>
              .
              <br />
              {t('warranty.15')}
              <br />
              {t('warranty.16')}
              <br />
              {t('warranty.17')}
              <br />
            </div>
          </div>
          <div className="delivery-fade" hidden={tab !== 'delivery'}>
            <p key={1} className="mb-4 fs-5 fw-bold">{tDelivery('delivery')}</p>
            <p key={2}>{tDelivery('1')}</p>
            <p key={3}>{tDelivery('2')}</p>
            <div key={4} className="mb-4">
              {tDelivery('3')}
              <br />
              {tDelivery('4')}
            </div>
            <div key={5}>
              {tDelivery('5')}
              <Link href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_MAIL}`} target="_blank" className="fw-bold">{process.env.NEXT_PUBLIC_CONTACT_MAIL}</Link>
              {tDelivery('6')}
              <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank" className="fw-bold">@KS_Mary</Link>
              {tDelivery('7')}
              <br />
              {tDelivery('8')}
            </div>
            <p key={6} className="my-4">{tDelivery('9')}</p>
            <p key={7} className="mb-4 fs-5 fw-bold">{tDelivery('10')}</p>
            <div key={8}>
              {tDelivery('11')}
              <br />
              {tDelivery('12')}
            </div>
          </div>
        </div>
      </div>
      <GradeList item={item} setItem={setItem} />
      {relatedGroupItems.length ? (
        <div className="d-flex flex-column align-items-start align-items-xl-end mt-5">
          <h4 className="col-11 mb-5 text-uppercase">{t('otherItem')}</h4>
          <Carousel
            autoPlaySpeed={2000}
            containerClass="col-12 col-xl-11"
            focusOnSelect={true}
            infinite
            arrows={true}
            minimumTouchDrag={80}
            renderArrowsWhenDisabled={false}
            renderButtonGroupOutside={false}
            renderDotsOutside={false}
            partialVisible={true}
            responsive={responsive}
            shouldResetAutoplay
            showDots={false}
            slidesToSlide={1}
            ssr={true}
            swipeable={false}
            draggable={false}
            deviceType={isMobile ? 'mobile' : 'desktop'}
            autoPlay
            pauseOnHover
          >
            {relatedGroupItems.map((relatedItem) => (
              <ImageHover
                key={relatedItem.id}
                href={getHref(relatedItem)}
                height={height}
                width={width}
                images={relatedItem.images}
                name={relatedItem.translations.find((translation) => translation.lang === lang)?.name}
                imageAlt={buildItemImageAlt(relatedItem)}
                rating={{ rating: relatedItem.rating, grades: relatedItem.grades }}
                description={t('price', { price: relatedItem.price - relatedItem.discountPrice })}
              />
            ))}
          </Carousel>
        </div>
      ) : null}
    </div>
  );
};
