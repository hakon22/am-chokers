import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useContext, type WheelEvent, useMemo } from 'react';
import Carousel from 'react-multi-carousel';
import { throttle } from 'lodash';
import { ArrowRight } from 'react-bootstrap-icons';
import cn from 'classnames';

import uniqueDecoration from '@/images/unique-decoration.jpg';
import { ImageHover } from '@/components/ImageHover';
import { routes } from '@/routes';
import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/utilities/hooks';
import { ContextMenu } from '@/components/ContextMenu';
import { MobileContext } from '@/components/Context';
import { getHref } from '@/utilities/getHref';
import { getWidth } from '@/utilities/screenExtension';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemInterface } from '@/types/item/Item';
import type { ImageEntity } from '@server/db/entities/image.entity';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const { isMobile } = useContext(MobileContext);

  const { specialItems, coverImages } = useAppSelector((state) => state.app);
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const [coverSize, setCoverSize] = useState<{ cover: { width: string | number; height: number; }; coverCollection: { width: string | number; height: number; } }>({ cover: { width: '100%', height: 200 }, coverCollection: { width: 450, height: 299 } });
  const [autoPlay, setAutoPlay] = useState(false);

  const { bestsellers, collections, news } = useMemo(() => specialItems.reduce((acc, item) => {
    if (item.new) {
      acc.news.push(item);
    }
    if (item.bestseller) {
      acc.bestsellers.push(item);
    }
    if (item.collection) {
      acc.collections.push(item);
    }
    return acc;
  }, { bestsellers: [], collections: [], news: [] } as { bestsellers: ItemInterface[]; collections: ItemInterface[]; news: ItemInterface[]; }), [specialItems]);

  const { bestseller1, bestseller2, bestseller3 } = useMemo(() => bestsellers.reduce((acc, item) => {
    if (!item.deleted) {
      switch (item.order) {
      case 1:
        acc.bestseller1 = item;
        break;
      case 2:
        acc.bestseller2 = item;
        break;
      case 3:
        acc.bestseller3 = item;
        break;
      }
    }
    return acc;
  }, { bestseller1: undefined, bestseller2: undefined, bestseller3: undefined } as { bestseller1?: ItemInterface; bestseller2?: ItemInterface; bestseller3?: ItemInterface; }), [bestsellers]);

  const { collection1, collection2, collection3, collection4, collection5 } = useMemo(() => collections.reduce((acc, item) => {
    if (!item.deleted) {
      switch (item.order) {
      case 4:
        acc.collection1 = item;
        break;
      case 5:
        acc.collection2 = item;
        break;
      case 6:
        acc.collection3 = item;
        break;
      case 7:
        acc.collection4 = item;
        break;
      case 8:
        acc.collection5 = item;
        break;
      }
    }
    return acc;
  }, { collection1: undefined, collection2: undefined, collection3: undefined, collection4: undefined, collection5: undefined } as { collection1?: ItemInterface; collection2?: ItemInterface; collection3?: ItemInterface; collection4?: ItemInterface; collection5?: ItemInterface; }), [collections]);

  const { coverImage1, coverImage2, coverImage3, coverImage4, coverImage5, coverImage6, coverCollectionImage9, coverCollectionImage10, coverCollectionImage11, coverCollectionImage12, coverCollectionImage13 } = useMemo(() => coverImages.reduce((acc, image) => {
    switch (image.coverOrder) {
    case 1:
      acc.coverImage1 = image;
      break;
    case 2:
      acc.coverImage2 = image;
      break;
    case 3:
      acc.coverImage3 = image;
      break;
    case 4:
      acc.coverImage4 = image;
      break;
    case 5:
      acc.coverImage5 = image;
      break;
    case 6:
      acc.coverImage6 = image;
      break;
    case 9:
      acc.coverCollectionImage9 = image;
      break;
    case 10:
      acc.coverCollectionImage10 = image;
      break;
    case 11:
      acc.coverCollectionImage11 = image;
      break;
    case 12:
      acc.coverCollectionImage12 = image;
      break;
    case 13:
      acc.coverCollectionImage13 = image;
      break;
    }
    return acc;
  }, {
    coverImage1: undefined,
    coverImage2: undefined,
    coverImage3: undefined,
    coverImage4: undefined,
    coverImage5: undefined,
    coverImage6: undefined,
    coverCollectionImage9: undefined,
    coverCollectionImage10: undefined,
    coverCollectionImage11: undefined,
    coverCollectionImage12: undefined,
    coverCollectionImage13: undefined,
  } as {
    coverImage1?: ImageEntity;
    coverImage2?: ImageEntity;
    coverImage3?: ImageEntity;
    coverImage4?: ImageEntity;
    coverImage5?: ImageEntity;
    coverImage6?: ImageEntity;
    coverCollectionImage9?: ImageEntity;
    coverCollectionImage10?: ImageEntity;
    coverCollectionImage11?: ImageEntity;
    coverCollectionImage12?: ImageEntity;
    coverCollectionImage13?: ImageEntity;
  }), [coverImages]);

  const coefficient = 1.3;

  const width = 230;
  const height = width * coefficient;

  const carouselRef = useRef<Carousel>(null);

  const responsive = {
    desktop: {
      breakpoint: { max: 5000, min: 1400 },
      items: 5,
    },
    laptop: {
      breakpoint: { max: 1400, min: 1200 },
      items: 4,
    },
    largeTv: {
      breakpoint: { max: 1199, min: 991 },
      items: 2,
      partialVisibilityGutter: 130,
    },
    tv: {
      breakpoint: { max: 990, min: 768 },
      items: 2,
    },
    largeMobile: {
      breakpoint: { max: 767, min: 540 },
      items: 1,
      partialVisibilityGutter: 170,
    },
    middleMobile: {
      breakpoint: { max: 539, min: 500 },
      items: 1,
      partialVisibilityGutter: 130,
    },
    mobile: {
      breakpoint: { max: 499, min: 0 },
      items: 1,
    },
  };

  const handleWheel = throttle((event: WheelEvent<HTMLDivElement>) => {
    if (carouselRef.current) {
      if (event.deltaY > 0) {
        carouselRef.current.next(1);
      } else {
        carouselRef.current.previous(1);
      }
    }
  }, 1000);

  useEffect(() => {
    setTimeout(setAutoPlay, 2000, true);

    const handleResize = () => {
      const extension = getWidth();
      setCoverSize({
        cover: {
          width: extension > 1400
            ? '100%'
            : extension < 1200
              ? 300
              : 352,
          height: extension > 1400
            ? 200
            : extension < 1200
              ? 136
              : 160,
        },
        coverCollection: {
          width: extension >= 1200 ? 450 : 300,
          height: extension >= 1200 ? 299 : 199.3,
        },
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="d-flex justify-content-center" onWheel={handleWheel}>
      <Helmet title={t('title')} description={t('description')} />
      {!isMobile && <Link href={routes.page.base.catalog} title={t('seeCatalog')} className="button border-button position-absolute" style={{ borderRadius: '6px', top: '150px', padding: '0.5rem 0.7rem', zIndex: 1 }}>{t('seeCatalog')}</Link>}
      <div className="mb-5 col-12 d-flex flex-column align-items-center gap-3">
        <div className="index-block-container">
          <section className="mb-5 position-relative">
            <div className="d-flex flex-column flex-xl-row justify-content-between col-12">
              <div className="d-flex flex-column justify-content-xl-end justify-content-center justify-content-xl-start col-12 col-xl-2">
                <h2 className="text-center text-xl-start">{t('newItems')}</h2>
                <Link href={`${routes.page.base.catalog}?new=true`} className="see-all color-dark-blue icon-button">
                  <span>{t('seeAll')}</span>
                  <ArrowRight />
                </Link>
              </div>
              <Carousel
                autoPlaySpeed={2000}
                centerMode={false}
                containerClass="col-12 index-block-container-carousel"
                draggable={false}
                focusOnSelect={false}
                infinite
                ref={carouselRef}
                arrows={isMobile}
                minimumTouchDrag={80}
                renderArrowsWhenDisabled={false}
                renderButtonGroupOutside={false}
                renderDotsOutside={false}
                partialVisible={true}
                responsive={responsive}
                rewind={false}
                rewindWithAnimation={false}
                rtl={false}
                shouldResetAutoplay
                showDots={false}
                slidesToSlide={1}
                swipeable
                ssr
                autoPlay={autoPlay}
              >
                {news.map((item) => (
                  <ImageHover
                    key={item.id}
                    className={isMobile ? 'align-items-center' : 'me-3'}
                    href={getHref(item)}
                    height={isMobile ? 300 * coefficient : height}
                    width={isMobile ? 300 : width}
                    images={item.images}
                    name={item.translations.find((translation) => translation.lang === lang)?.name}
                    rating={{ rating: item.rating, grades: item.grades }}
                    description={tPrice('price', { price: item.price - item.discountPrice })}
                  />
                ))}
              </Carousel>
            </div>
          </section>
          <section className="d-flex flex-column position-relative col-12 col-xl-11" data-aos="fade-right" data-aos-duration="1500" style={{ gap: '4rem' }}>
            <div className="d-flex flex-column justify-content-center justify-content-xl-start">
              <h2>{t('bestsellers')}</h2>
              <Link href={`${routes.page.base.catalog}?bestseller=true`} className="see-all color-dark-blue icon-button">
                <span>{t('seeAll')}</span>
                <ArrowRight />
              </Link>
            </div>
            <div className="d-flex flex-column flex-xl-row justify-content-between gap-4 gap-xl-0">
              <div className="d-flex flex-column col-12 col-xl-6 col-xxl-5 justify-content-between gap-5 gap-xl-0">
                <ContextMenu item={bestseller1} order={1} className="col-12 col-xl-6 align-self-start" style={{ width: '95%' }}>
                  <ImageHover
                    height={height}
                    width={width}
                    href={getHref(bestseller1)}
                    images={bestseller1?.images ?? []}
                    name={bestseller1?.translations.find((translation) => translation.lang === lang)?.name}
                    rating={bestseller1 ? { rating: bestseller1.rating, grades: bestseller1.grades } : undefined}
                    description={tPrice('price', { price: bestseller1 ? bestseller1.price - bestseller1?.discountPrice : 0 })}
                  />
                </ContextMenu>
                <ContextMenu item={bestseller2} order={2} className="col-12 col-xl-6 d-flex align-self-end">
                  <ImageHover
                    className="w-100"
                    href={getHref(bestseller2)}
                    style={{ alignSelf: 'end' }}
                    height={height}
                    width={width}
                    images={bestseller2?.images ?? []}
                    name={bestseller2?.translations.find((translation) => translation.lang === lang)?.name}
                    rating={bestseller2 ? { rating: bestseller2.rating, grades: bestseller2.grades } : undefined}
                    description={tPrice('price', { price: bestseller2 ? bestseller2.price - bestseller2.discountPrice : 0 })}
                  />
                </ContextMenu>
              </div>
              <div className="col-0 col-xl-1 col-xxl-2" />
              <div className="d-flex">
                <ContextMenu item={bestseller3} order={3} className="w-100">
                  <ImageHover
                    style={{ alignSelf: 'center' }}
                    href={getHref(bestseller3)}
                    width={isMobile ? 300 : 551}
                    height={(isMobile ? 300 : 551) * coefficient}
                    images={bestseller3?.images ?? []}
                    name={bestseller3?.translations.find((translation) => translation.lang === lang)?.name}
                    rating={bestseller3 ? { rating: bestseller3.rating, grades: bestseller3.grades } : undefined}
                    description={tPrice('price', { price: bestseller3 ? bestseller3.price - bestseller3.discountPrice : 0 })}
                  />
                </ContextMenu>
              </div>
            </div>
          </section>
          <section className="d-flex flex-column align-items-center col-12" data-aos="fade-left" data-aos-duration="1500" style={{ gap: '2rem' }}>
            <h2 className="col-12 col-xxl-10 lh-base">
              {t('slogan.create')}
              <br />
              {t('slogan.uniqueDecoration')}
            </h2>
            <div className="guide col-12 col-xxl-10">
              <div className="d-flex lh-base">
                {!isMobile && <Image src={uniqueDecoration} className="col-5" unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} alt={t('slogan.uniqueDecoration')} priority />}
                <div className="guide-text w-100 d-flex flex-column">
                  <h3 className="mb-4 text-center text-xl-start">{t('slogan.title')}</h3>
                  <p className="fs-5 mb-4">{t('slogan.paragraph')}</p>
                  <ul className="d-flex flex-column gap-2 mb-4">
                    <li>
                      {t('slogan.1')}
                      <Link href={process.env.NEXT_PUBLIC_URL_PERSONAL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank" className="fw-bold">{t('slogan.1.1')}</Link>
                      {t('slogan.1.2')}
                    </li>
                    <li>{t('slogan.2')}</li>
                    <li>{t('slogan.3')}</li>
                    <li>{t('slogan.4')}</li>
                    <li>{t('slogan.5')}</li>
                  </ul>
                  <div className="d-flex justify-content-center">
                    <Link href={process.env.NEXT_PUBLIC_URL_PERSONAL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank" title={t('slogan.wantButton')} className="button border-button" style={{ borderRadius: '7px', padding: '0.5rem 0.7rem' }}>{t('slogan.wantButton')}</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="d-flex flex-column align-items-center" style={{ rowGap: isMobile ? '4rem' : '7rem' }}>
            {!isMobile && <div className="col-5">
              <h2 className="text-center">{t('collections')}</h2>
            </div>}
            <div className={cn('d-flex flex-column flex-xl-row-reverse col-12', { 'flex-column-reverse': isMobile })}>
              <div className="d-flex flex-column gap-5 gap-xl-0 flex-xl-row-reverse justify-content-center justify-content-xl-between col-12 col-xl-8 col-xxl-7">
                {!isMobile && <ContextMenu item={collection5} order={8} data-aos="fade-right" data-aos-duration="1500">
                  <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0">
                    <ImageHover
                      className="col-12 col-xl-6"
                      style={{ alignSelf: isMobile ? 'center' : 'start' }}
                      href={getHref(collection5)}
                      height={height}
                      width={width}
                      images={collection5?.images ?? []}
                      name={collection5?.translations.find((translation) => translation.lang === lang)?.name}
                      rating={collection5 ? { rating: collection5.rating, grades: collection5.grades } : undefined}
                      description={tPrice('price', { price: collection5 ? collection5.price - collection5.discountPrice : 0 })}
                    />
                  </div>
                </ContextMenu>}
                <ContextMenu image={coverCollectionImage13} cover={13} isCoverCollection data-aos="fade-right" data-aos-duration="1500">
                  <ImageHover
                    className={isMobile ? 'align-items-center' : ''}
                    width={coverSize.coverCollection.width}
                    height={coverSize.coverCollection.height}
                    images={(coverCollectionImage13 ? [coverCollectionImage13] : [])}
                  />
                </ContextMenu>
              </div>
              <div className="col-xl-5 d-flex justify-content-center mb-5 mb-xl-0" data-aos="fade-right" data-aos-duration="1500">
                <Link href={collection5 ? `${routes.page.base.catalog}?collectionIds=${collection5?.collection?.id}` : routes.page.base.catalog} className="h2 text-with-arrow">{collection5?.collection?.translations.find((translation) => translation.lang === lang)?.name}</Link>
              </div>
            </div>
            <div className={cn('d-flex flex-column flex-xl-row col-12', { 'flex-column-reverse': isMobile })}>
              <div className="d-flex flex-column gap-5 gap-xl-0 flex-xl-row justify-content-center justify-content-xl-between col-12 col-xl-8 col-xxl-7">
                {!isMobile && <ContextMenu item={collection1} order={4} data-aos="fade-right" data-aos-duration="1500">
                  <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0">
                    <ImageHover
                      className="col-12 col-xl-6"
                      style={{ alignSelf: isMobile ? 'center' : 'start' }}
                      href={getHref(collection1)}
                      height={height}
                      width={width}
                      images={collection1?.images ?? []}
                      name={collection1?.translations.find((translation) => translation.lang === lang)?.name}
                      rating={collection1 ? { rating: collection1.rating, grades: collection1.grades } : undefined}
                      description={tPrice('price', { price: collection1 ? collection1.price - collection1.discountPrice : 0 })}
                    />
                  </div>
                </ContextMenu>}
                <ContextMenu image={coverCollectionImage9} cover={9} isCoverCollection data-aos="fade-right" data-aos-duration="1500">
                  <ImageHover
                    className={isMobile ? 'align-items-center' : ''}
                    width={coverSize.coverCollection.width}
                    height={coverSize.coverCollection.height}
                    images={(coverCollectionImage9 ? [coverCollectionImage9] : [])}
                  />
                </ContextMenu>
              </div>
              <div className="col-xl-5 d-flex justify-content-center mb-5 mb-xl-0" data-aos="fade-left" data-aos-duration="1500">
                <Link href={collection1 ? `${routes.page.base.catalog}?collectionIds=${collection1?.collection?.id}` : routes.page.base.catalog} className="h2 text-with-arrow-reverse">{collection1?.collection?.translations.find((translation) => translation.lang === lang)?.name}</Link>
              </div>
            </div>
            <div className={cn('d-flex flex-column flex-xl-row-reverse col-12', { 'flex-column-reverse': isMobile })}>
              <div className="d-flex flex-column gap-5 gap-xl-0 flex-xl-row flex-xl-row-reverse justify-content-center justify-content-xl-between col-12 col-xl-8 col-xxl-7">
                {!isMobile && <ContextMenu item={collection2} order={5} data-aos="fade-left" data-aos-duration="1500">
                  <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0">
                    <ImageHover
                      className="col-12 col-xl-6"
                      style={{ alignSelf: isMobile ? 'center' : 'start' }}
                      href={getHref(collection2)}
                      height={height}
                      width={width}
                      images={collection2?.images ?? []}
                      name={collection2?.translations.find((translation) => translation.lang === lang)?.name}
                      rating={collection2 ? { rating: collection2.rating, grades: collection2.grades } : undefined}
                      description={tPrice('price', { price: collection2 ? collection2.price - collection2.discountPrice : 0 })}
                    />
                  </div>
                </ContextMenu>}
                <ContextMenu image={coverCollectionImage10} cover={10} isCoverCollection data-aos="fade-left" data-aos-duration="1500">
                  <ImageHover
                    className={isMobile ? 'align-items-center' : ''}
                    width={coverSize.coverCollection.width}
                    height={coverSize.coverCollection.height}
                    images={(coverCollectionImage10 ? [coverCollectionImage10] : [])}
                  />
                </ContextMenu>
              </div>
              <div className="d-flex justify-content-center col-xl-5 mb-5 mb-xl-0" data-aos="fade-right" data-aos-duration="1500">
                <Link href={collection2 ? `${routes.page.base.catalog}?collectionIds=${collection2?.collection?.id}` : routes.page.base.catalog} className="h2 text-with-arrow">{collection2?.collection?.translations.find((translation) => translation.lang === lang)?.name}</Link>
              </div>
            </div>
            <div className={cn('d-flex flex-column flex-xl-row-reverse col-12', { 'flex-column-reverse': isMobile })}>
              <div className="d-flex flex-column gap-5 gap-xl-0 flex-xl-row flex-xl-row-reverse justify-content-center justify-content-xl-between col-12 col-xl-8 col-xxl-7">
                {!isMobile && <ContextMenu item={collection3} order={6} data-aos="fade-left" data-aos-duration="1500">
                  <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0">
                    <ImageHover
                      className="col-12 col-xl-6"
                      style={{ alignSelf: isMobile ? 'center' : 'start' }}
                      href={getHref(collection3)}
                      height={height}
                      width={width}
                      images={collection3?.images ?? []}
                      name={collection3?.translations.find((translation) => translation.lang === lang)?.name}
                      rating={collection3 ? { rating: collection3.rating, grades: collection3.grades } : undefined}
                      description={tPrice('price', { price: collection3 ? collection3.price - collection3.discountPrice : 0 })}
                    />
                  </div>
                </ContextMenu>}
                <ContextMenu image={coverCollectionImage11} cover={11} isCoverCollection data-aos="fade-left" data-aos-duration="1500">
                  <ImageHover
                    className={isMobile ? 'align-items-center' : ''}
                    width={coverSize.coverCollection.width}
                    height={coverSize.coverCollection.height}
                    images={(coverCollectionImage11 ? [coverCollectionImage11] : [])}
                  />
                </ContextMenu>
              </div>
              <div className="d-flex justify-content-center col-xl-5 mb-5 mb-xl-0" data-aos="fade-right" data-aos-duration="1500">
                <Link href={collection3 ? `${routes.page.base.catalog}?collectionIds=${collection3?.collection?.id}` : routes.page.base.catalog} className="h2 text-with-arrow">{collection3?.collection?.translations.find((translation) => translation.lang === lang)?.name}</Link>
              </div>
            </div>
            <div className={cn('d-flex flex-column flex-xl-row col-12', { 'flex-column-reverse': isMobile })}>
              <div className="d-flex flex-column gap-5 gap-xl-0 flex-xl-row justify-content-center justify-content-xl-between col-12 col-xl-8 col-xxl-7">
                {!isMobile && <ContextMenu item={collection4} order={7} data-aos="fade-right" data-aos-duration="1500">
                  <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0">
                    <ImageHover
                      className="col-12 col-xl-6"
                      style={{ alignSelf: isMobile ? 'center' : 'start' }}
                      href={getHref(collection4)}
                      height={height}
                      width={width}
                      images={collection4?.images ?? []}
                      name={collection4?.translations.find((translation) => translation.lang === lang)?.name}
                      rating={collection4 ? { rating: collection4.rating, grades: collection4.grades } : undefined}
                      description={tPrice('price', { price: collection4 ? collection4.price - collection4.discountPrice : 0 })}
                    />
                  </div>
                </ContextMenu>}
                <ContextMenu image={coverCollectionImage12} cover={12} isCoverCollection data-aos="fade-right" data-aos-duration="1500">
                  <ImageHover
                    className={isMobile ? 'align-items-center' : ''}
                    width={coverSize.coverCollection.width}
                    height={coverSize.coverCollection.height}
                    images={(coverCollectionImage12 ? [coverCollectionImage12] : [])}
                  />
                </ContextMenu>
              </div>
              <div className="col-xl-5 d-flex justify-content-center mb-5 mb-xl-0" data-aos="fade-left" data-aos-duration="1500">
                <Link href={collection4 ? `${routes.page.base.catalog}?collectionIds=${collection4?.collection?.id}` : routes.page.base.catalog} className="h2 text-with-arrow-reverse">{collection4?.collection?.translations.find((translation) => translation.lang === lang)?.name}</Link>
              </div>
            </div>
          </section>
          <section className="d-flex flex-column col-12 gap-5">
            <div className="d-flex flex-column flex-xl-row justify-content-between align-items-center gap-5 gap-xl-0">
              <ContextMenu className="col-12 col-xl-4" image={coverImage1} cover={1} data-aos="fade-right" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.cover.width}
                  height={coverSize.cover.height}
                  images={(coverImage1 ? [coverImage1] : [])}
                  href={`${routes.page.base.catalog}?groupIds=1&groupIds=2`}
                />
              </ContextMenu>
              <Link href={`${routes.page.base.catalog}?groupIds=1&groupIds=2`} className="col-12 col-xl-4 text-center h2" style={{ width: 'max-content' }}>{t('necklacesAndChokers')}</Link>
              <ContextMenu className="col-12 col-xl-4" image={coverImage2} cover={2} data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.cover.width}
                  height={coverSize.cover.height}
                  images={(coverImage2 ? [coverImage2] : [])}
                  href={`${routes.page.base.catalog}?groupIds=1&groupIds=2`}
                />
              </ContextMenu>
            </div>
            <div className="d-flex flex-column flex-xl-row justify-content-between align-items-center gap-5 gap-xl-0">
              <ContextMenu className="col-12 col-xl-4" image={coverImage3} cover={3} data-aos="fade-right" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.cover.width}
                  height={coverSize.cover.height}
                  images={(coverImage3 ? [coverImage3] : [])}
                  href={`${routes.page.base.catalog}/bracelet`}
                />
              </ContextMenu>
              <Link href={`${routes.page.base.catalog}/bracelet`} className="col-12 col-xl-4 text-center h2" style={{ width: 'max-content' }}>{t('bracelets')}</Link>
              <ContextMenu className="col-12 col-xl-4" image={coverImage4} cover={4} data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.cover.width}
                  height={coverSize.cover.height}
                  images={(coverImage4 ? [coverImage4] : [])}
                  href={`${routes.page.base.catalog}/bracelet`}
                />
              </ContextMenu>
            </div>
            <div className="d-flex flex-column flex-xl-row justify-content-between align-items-center gap-5 gap-xl-0">
              <ContextMenu className="col-12 col-xl-4" image={coverImage5} cover={5} data-aos="fade-right" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.cover.width}
                  height={coverSize.cover.height}
                  images={(coverImage5 ? [coverImage5] : [])}
                  href={`${routes.page.base.catalog}/earrings`}
                />
              </ContextMenu>
              <Link href={`${routes.page.base.catalog}/earrings`} className="col-12 col-xl-4 text-center h2" style={{ width: 'max-content' }}>{t('earrings')}</Link>
              <ContextMenu className="col-12 col-xl-4" image={coverImage6} cover={6} data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.cover.width}
                  height={coverSize.cover.height}
                  images={(coverImage6 ? [coverImage6] : [])}
                  href={`${routes.page.base.catalog}/earrings`}
                />
              </ContextMenu>
            </div>
          </section>
          <section className="d-flex flex-column align-items-center col-12 text-center" data-aos="fade-right" data-aos-duration="1500" style={isMobile ? { marginBottom: '-200px' } : {}}>
            <div className="font-good-vibes-pro mb-5" style={isMobile ? { fontSize: '24px' } : {}}>{t('iEmphasizeYourIndividuality')}</div>
            <p className="d-flex flex-column fw-light fs-5 mb-1">
              <span className="mb-1">{t('subscribe')}</span>
              <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} className="color-dark-blue icon-button ms-1" target="_blank">@AMChokers</Link>
            </p>
            <p className="fw-light fs-5">{t('getUpdates')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
