import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useContext, type WheelEvent } from 'react';
import Carousel from 'react-multi-carousel';
import { throttle } from 'lodash';
import { ArrowRight } from 'react-bootstrap-icons';
import { FloatButton } from 'antd';
import cn from 'classnames';

import pendant from '@/images/pendant.png';
import choker from '@/images/choker.png';
import uniqueDecoration from '@/images/unique-decoration.jpg';
import { ImageHover } from '@/components/ImageHover';
import { routes } from '@/routes';
import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/utilities/hooks';
import { ContextMenu } from '@/components/ContextMenu';
import { MobileContext, SearchContext } from '@/components/Context';
import { getHref } from '@/utilities/getHref';
import { getWidth } from '@/utilities/screenExtension';
import type { ItemInterface } from '@/types/item/Item';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const { isSearch } = useContext(SearchContext);
  const { isMobile } = useContext(MobileContext);

  const { specialItems, coverImages } = useAppSelector((state) => state.app);

  const [isLoaded, setIsLoaded] = useState(false);
  const [coverSize, setCoverSize] = useState<{ width: string | number; height: number; }>({ width: '100%', height: 200 });

  const { bestsellers, collections, news } = specialItems.reduce((acc, item) => {
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
  }, { bestsellers: [], collections: [], news: [] } as { bestsellers: ItemInterface[]; collections: ItemInterface[]; news: ItemInterface[]; });

  const bestseller1 = bestsellers.find(({ deleted, order }) => order === 1 && !deleted);
  const bestseller2 = bestsellers.find(({ deleted, order }) => order === 2 && !deleted);
  const bestseller3 = bestsellers.find(({ deleted, order }) => order === 3 && !deleted);

  const collection1 = collections.find(({ deleted, order }) => order === 4 && !deleted);
  const collection2 = collections.find(({ deleted, order }) => order === 5 && !deleted);
  const collection3 = collections.find(({ deleted, order }) => order === 6 && !deleted);

  const coverImage1 = coverImages.find(({ coverOrder }) => coverOrder === 1);
  const coverImage2 = coverImages.find(({ coverOrder }) => coverOrder === 2);
  const coverImage3 = coverImages.find(({ coverOrder }) => coverOrder === 3);
  const coverImage4 = coverImages.find(({ coverOrder }) => coverOrder === 4);
  const coverImage5 = coverImages.find(({ coverOrder }) => coverOrder === 5);
  const coverImage6 = coverImages.find(({ coverOrder }) => coverOrder === 6);
  const coverImage7 = coverImages.find(({ coverOrder }) => coverOrder === 7);
  const coverImage8 = coverImages.find(({ coverOrder }) => coverOrder === 8);
  const coverCollectionImage9 = coverImages.find(({ coverOrder }) => coverOrder === 9);
  const coverCollectionImage10 = coverImages.find(({ coverOrder }) => coverOrder === 10);
  const coverCollectionImage11 = coverImages.find(({ coverOrder }) => coverOrder === 11);

  const coefficient = 1.3;

  const width = 230;
  const height = width * coefficient;

  const carouselRef = useRef<Carousel>(null);

  const responsive = {
    desktop: {
      breakpoint: {
        max: 3000,
        min: 1024,
      },
      items: 5,
    },
    mobile: {
      breakpoint: {
        max: 464,
        min: 0,
      },
      items: 1,
    },
    tablet: {
      breakpoint: {
        max: 1024,
        min: 464,
      },
      items: 2,
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
    const handleResize = () => {
      const extension = getWidth();
      setCoverSize({
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
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setTimeout(setIsLoaded, 1000, true);
  }, []);

  return (
    <div className="d-flex justify-content-center" onWheel={handleWheel}>
      <Helmet title={t('title')} description={t('description')} />
      <FloatButton.BackTop />
      {!isMobile
        ? (
          <>
            <Link href={routes.catalog} title={t('seeCatalog')} className="button border-button position-absolute" style={{ borderRadius: '6px', top: '150px', padding: '0.5rem 0.7rem' }}>{t('seeCatalog')}</Link>
            {isLoaded && (
              <>
                <div className="position-absolute top-0 pe-none animate__animated animate__fadeInDownBig" style={{ zIndex: isSearch?.value ? 1 : 3, height: '62vh', width: '55%' }}>
                  <Image src={choker} unoptimized fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} alt={t('title')} priority />
                </div>
                <div className="position-absolute top-0 pe-none animate__animated animate__fadeInDownBig" style={{ zIndex: isSearch?.value ? 0 : 2, height: '105vh', width: '60%' }}>
                  <Image src={pendant} unoptimized fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} alt={t('title')} priority />
                </div>
              </>
            )}
          </>
        ) : null}
      <div className="mb-5 col-12 d-flex flex-column align-items-center gap-3">
        <div className="index-block-container">
          <section className="mb-5" data-aos="fade-right" data-aos-duration="1500">
            <div className="d-flex flex-column flex-xl-row justify-content-between col-12">
              <div className="d-flex flex-column justify-content-xl-end justify-content-center justify-content-xl-start col-12 col-xl-2">
                <h2 className="text-center text-xl-start">{t('newItems')}</h2>
                <Link href={`${routes.catalog}?new=true`} className="see-all color-dark-blue icon-button">
                  <span>{t('seeAll')}</span>
                  <ArrowRight />
                </Link>
              </div>
              <Carousel
                autoPlaySpeed={3000}
                centerMode={false}
                containerClass="col-12 index-block-container-carousel"
                draggable={false}
                focusOnSelect={false}
                infinite
                ref={carouselRef}
                arrows={isMobile}
                minimumTouchDrag={80}
                partialVisible={false}
                renderArrowsWhenDisabled={false}
                renderButtonGroupOutside={false}
                renderDotsOutside={false}
                partialVisbile={false}
                responsive={responsive}
                rewind={false}
                rewindWithAnimation={false}
                rtl={false}
                shouldResetAutoplay
                showDots={false}
                slidesToSlide={1}
                swipeable
                ssr
              >
                {news.map((item) => (
                  <ImageHover
                    key={item.id}
                    className={isMobile ? 'align-items-center' : item.className}
                    href={getHref(item)}
                    height={isMobile ? 300 * coefficient : height}
                    width={isMobile ? 300 : width}
                    images={item.images}
                    name={item.name}
                    rating={{ rating: item.rating, grades: item.grades }}
                    description={tPrice('price', { price: item.price - item.discountPrice })}
                  />
                ))}
              </Carousel>
            </div>
          </section>
          <section className="d-flex flex-column col-12 col-xl-11" data-aos="fade-right" data-aos-duration="1500" style={{ gap: '4rem' }}>
            <div className="d-flex flex-column justify-content-center justify-content-xl-start">
              <h2>{t('bestsellers')}</h2>
              <Link href={`${routes.catalog}?bestseller=true`} className="see-all color-dark-blue icon-button">
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
                    name={bestseller1?.name}
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
                    name={bestseller2?.name}
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
                    height={isMobile ? 300 * coefficient : 551 * coefficient}
                    images={bestseller3?.images ?? []}
                    name={bestseller3?.name}
                    rating={bestseller3 ? { rating: bestseller3.rating, grades: bestseller3.grades } : undefined}
                    description={tPrice('price', { price: bestseller3 ? bestseller3.price - bestseller3.discountPrice : 0 })}
                  />
                </ContextMenu>
              </div>
            </div>
          </section>
          <section className="d-flex flex-column align-items-center col-12" data-aos="fade-left" data-aos-duration="1500" style={{ gap: '2rem' }}>
            <h2 className="col-12 col-xl-10 lh-base">
              {t('slogan.create')}
              <br />
              {t('slogan.uniqueDecoration')}
            </h2>
            <div className="guide col-12 col-xl-10">
              <div className="d-flex lh-base">
                {!isMobile && <Image src={uniqueDecoration} className="col-5" unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} alt={t('slogan.uniqueDecoration')} priority />}
                <div className="guide-text w-100 d-flex flex-column">
                  <h3 className="mb-4 text-center text-xl-start">{t('slogan.title')}</h3>
                  <p className="fs-5 mb-4">{t('slogan.paragraph')}</p>
                  <ul className="d-flex flex-column gap-2 mb-4">
                    <li>
                      {t('slogan.1')}
                      <Link href={process.env.NEXT_PUBLIC_URL_PERSONAL_TG_ACCOUNT ?? routes.homePage} target="_blank" className="fw-bold">{t('slogan.1.1')}</Link>
                      {t('slogan.1.2')}
                    </li>
                    <li>{t('slogan.2')}</li>
                    <li>{t('slogan.3')}</li>
                    <li>{t('slogan.4')}</li>
                    <li>{t('slogan.5')}</li>
                  </ul>
                  <div className="d-flex justify-content-center">
                    <Link href={process.env.NEXT_PUBLIC_URL_PERSONAL_TG_ACCOUNT ?? routes.homePage} target="_blank" title={t('slogan.wantButton')} className="button border-button" style={{ borderRadius: '7px', padding: '0.5rem 0.7rem' }}>{t('slogan.wantButton')}</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="d-flex flex-column align-items-center" style={{ rowGap: isMobile ? '4rem' : '7rem' }}>
            {!isMobile && <div className="col-5">
              <h2 className="text-center">{t('collections')}</h2>
            </div>}
            <div className={cn('d-flex flex-column flex-xl-row col-12', { 'flex-column-reverse': isMobile })}>
              <div className="d-flex justify-content-center justify-content-xl-between col-12 col-xl-7">
                <ContextMenu item={collection1} order={4} data-aos="fade-right" data-aos-duration="1500">
                  <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0">
                    <ImageHover
                      className="col-12 col-xl-6"
                      style={{ alignSelf: isMobile ? 'center' : 'start' }}
                      href={getHref(collection1)}
                      height={height}
                      width={width}
                      images={collection1?.images ?? []}
                      name={collection1?.name}
                      rating={collection1 ? { rating: collection1.rating, grades: collection1.grades } : undefined}
                      description={tPrice('price', { price: collection1 ? collection1.price - collection1.discountPrice : 0 })}
                    />
                  </div>
                </ContextMenu>
                {/*!isMobile && <ContextMenu image={coverCollectionImage9} cover={9} isCoverCollection data-aos="fade-right" data-aos-duration="1500">
                  <ImageHover
                    className={isMobile ? 'align-items-center' : ''}
                    width={450}
                    height={299}
                    images={(coverCollectionImage9 ? [coverCollectionImage9] : [])}
                  />
                </ContextMenu>*/}
              </div>
              <div className="col-xl-5 d-flex justify-content-center mb-5 mb-xl-0" data-aos="fade-left" data-aos-duration="1500">
                <Link href={collection1 ? `${routes.catalog}?collectionIds=${collection1?.collection?.id}` : routes.catalog} className="h2 text-with-arrow">{collection1?.collection?.name}</Link>
              </div>
            </div>
            <div className={cn('d-flex flex-column flex-xl-row-reverse col-12', { 'flex-column-reverse': isMobile })}>
              <div className="d-flex flex-xl-row-reverse justify-content-center justify-content-xl-between col-12 col-xl-7">
                <ContextMenu item={collection2} order={5} data-aos="fade-left" data-aos-duration="1500">
                  <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0">
                    <ImageHover
                      className="col-12 col-xl-6"
                      style={{ alignSelf: isMobile ? 'center' : 'start' }}
                      href={getHref(collection2)}
                      height={height}
                      width={width}
                      images={collection2?.images ?? []}
                      name={collection2?.name}
                      rating={collection2 ? { rating: collection2.rating, grades: collection2.grades } : undefined}
                      description={tPrice('price', { price: collection2 ? collection2.price - collection2.discountPrice : 0 })}
                    />
                  </div>
                </ContextMenu>
                {/*!isMobile && <ContextMenu image={coverCollectionImage10} cover={10} isCoverCollection data-aos="fade-left" data-aos-duration="1500">
                  <ImageHover
                    className={isMobile ? 'align-items-center' : ''}
                    width={450}
                    height={299}
                    images={(coverCollectionImage10 ? [coverCollectionImage10] : [])}
                  />
                </ContextMenu>*/}
              </div>
              <div className="d-flex justify-content-center col-xl-5 mb-5 mb-xl-0" data-aos="fade-right" data-aos-duration="1500">
                <Link href={collection2 ? `${routes.catalog}?collectionIds=${collection2?.collection?.id}` : routes.catalog} className="h2 text-with-arrow">{collection2?.collection?.name}</Link>
              </div>
            </div>
            <div className={cn('d-flex flex-column flex-xl-row-reverse col-12', { 'flex-column-reverse': isMobile })}>
              <div className="d-flex flex-xl-row-reverse justify-content-center justify-content-xl-between col-12 col-xl-7">
                <ContextMenu item={collection3} order={6} data-aos="fade-left" data-aos-duration="1500">
                  <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0">
                    <ImageHover
                      className="col-12 col-xl-6"
                      style={{ alignSelf: isMobile ? 'center' : 'start' }}
                      href={getHref(collection3)}
                      height={height}
                      width={width}
                      images={collection3?.images ?? []}
                      name={collection3?.name}
                      rating={collection3 ? { rating: collection3.rating, grades: collection3.grades } : undefined}
                      description={tPrice('price', { price: collection3 ? collection3.price - collection3.discountPrice : 0 })}
                    />
                  </div>
                </ContextMenu>
                {/*!isMobile && <ContextMenu image={coverCollectionImage11} cover={11} isCoverCollection data-aos="fade-left" data-aos-duration="1500">
                  <ImageHover
                    className={isMobile ? 'align-items-center' : ''}
                    width={450}
                    height={299}
                    images={(coverCollectionImage11 ? [coverCollectionImage11] : [])}
                  />
                </ContextMenu>*/}
              </div>
              <div className="d-flex justify-content-center col-xl-5 mb-5 mb-xl-0" data-aos="fade-right" data-aos-duration="1500">
                <Link href={collection3 ? `${routes.catalog}?collectionIds=${collection3?.collection?.id}` : routes.catalog} className="h2 text-with-arrow">{collection3?.collection?.name}</Link>
              </div>
            </div>
          </section>
          <section className="d-flex flex-column col-12 gap-5">
            <div className="d-flex flex-column flex-xl-row align-items-center gap-5 gap-xl-0">
              <ContextMenu className="col-12 col-xl-4" image={coverImage1} cover={1} data-aos="fade-right" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.width}
                  height={coverSize.height}
                  images={(coverImage1 ? [coverImage1] : [])}
                />
              </ContextMenu>
              <h2 className="col-12 col-xl-4 text-center">{t('necklacesAndChokers')}</h2>
              <ContextMenu className="col-12 col-xl-4" image={coverImage2} cover={2} data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.width}
                  height={coverSize.height}
                  images={(coverImage2 ? [coverImage2] : [])}
                />
              </ContextMenu>
            </div>
            <div className="d-flex flex-column flex-xl-row align-items-center gap-5 gap-xl-0">
              <ContextMenu className="col-12 col-xl-4" image={coverImage3} cover={3} data-aos="fade-right" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.width}
                  height={coverSize.height}
                  images={(coverImage3 ? [coverImage3] : [])}
                />
              </ContextMenu>
              <h2 className="col-12 col-xl-4 text-center">{t('bracelets')}</h2>
              <ContextMenu className="col-12 col-xl-4" image={coverImage4} cover={4} data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.width}
                  height={coverSize.height}
                  images={(coverImage4 ? [coverImage4] : [])}
                />
              </ContextMenu>
            </div>
            <div className="d-flex flex-column flex-xl-row align-items-center gap-5 gap-xl-0">
              <ContextMenu className="col-12 col-xl-4" image={coverImage5} cover={5} data-aos="fade-right" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.width}
                  height={coverSize.height}
                  images={(coverImage5 ? [coverImage5] : [])}
                />
              </ContextMenu>
              <h2 className="col-12 col-xl-4 text-center">{t('earrings')}</h2>
              <ContextMenu className="col-12 col-xl-4" image={coverImage6} cover={6} data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.width}
                  height={coverSize.height}
                  images={(coverImage6 ? [coverImage6] : [])}
                />
              </ContextMenu>
            </div>
            {/*<div className="d-flex flex-column flex-xl-row align-items-center gap-5 gap-xl-0">
              <ContextMenu className="col-12 col-xl-4" image={coverImage7} cover={7} data-aos="fade-right" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.width}
                  height={coverSize.height}
                  images={(coverImage7 ? [coverImage7] : [])}
                />
              </ContextMenu>
              <h2 className="col-12 col-xl-4 text-center">{t('otherAccessories')}</h2>
              <ContextMenu className="col-12 col-xl-4" image={coverImage8} cover={8} data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.width}
                  height={coverSize.height}
                  images={(coverImage8 ? [coverImage8] : [])}
                />
              </ContextMenu>
            </div>*/}
          </section>
          <section className="d-flex flex-column align-items-center col-12 text-center" data-aos="fade-right" data-aos-duration="1500" style={isMobile ? { marginBottom: '-200px' } : {}}>
            <div className="font-mr_hamiltoneg fs-1 fw-bold mb-5">{t('iEmphasizeYourIndividuality')}</div>
            <p className="d-flex flex-column fw-light fs-5 mb-1">
              <span className="mb-1">{t('subscribe')}</span>
              <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.homePage} className="color-dark-blue icon-button ms-1" target="_blank">@AMChokers</Link>
            </p>
            <p className="fw-light fs-5">{t('getUpdates')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
