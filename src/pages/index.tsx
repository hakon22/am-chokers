import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useContext, type WheelEvent } from 'react';
import Carousel from 'react-multi-carousel';
import { throttle } from 'lodash';
import { ArrowRight } from 'react-bootstrap-icons';
import { FloatButton } from 'antd';

import pendant from '@/images/pendant.png';
import choker from '@/images/choker.png';
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
      items: 4,
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
            <Link href={routes.catalog} title={t('seeCatalog')} className="button border-button position-absolute" style={{ borderRadius: '6px', top: '150px', padding: '0.5rem 0.7rem' }}>Смотреть каталог</Link>
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
          <section className="d-flex flex-column position-relative mb-5" data-aos="fade-right" data-aos-duration="1500">
            <div className="d-flex flex-column flex-xl-row justify-content-between col-12">
              <h2 className="d-flex align-items-xl-end justify-content-center justify-content-xl-start col-12 col-xl-2">{t('newItems')}</h2>
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
                    height={height}
                    width={width}
                    images={item.images}
                    name={item.name}
                    rating={{ rating: item.rating, grades: item.grades }}
                    description={tPrice('price', { price: item.price - item.discountPrice })}
                  />
                ))}
              </Carousel>
            </div>
            <Link href={routes.catalog} className="see-all color-dark-blue icon-button">
              <span>{t('seeAll')}</span>
              <ArrowRight />
            </Link>
          </section>
          <section className="d-flex flex-column col-12 col-xl-11" data-aos="fade-right" data-aos-duration="1500" style={{ gap: '4rem' }}>
            <h2 className="d-flex justify-content-center justify-content-xl-start">{t('bestsellers')}</h2>
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
            <h2 className="lh-base">
              {t('slogan.create')}
              <br />
              {t('slogan.uniqueDecoration')}
            </h2>
            <div className="guide col-10">
              <span className="guide-text lh-base fs-2">
                {t('text.part1')}
                <br />
                {t('text.part2')}
              </span>
            </div>
          </section>
          <section className="d-flex flex-column align-items-center">
            {!isMobile
              ? <h2 className="col-10 text-center text-xl-start" style={{ marginBottom: '7%' }}>{t('collections')}</h2>
              : null}
            <div className="d-flex flex-column col-10" style={{ gap: '5rem' }}>
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
                  <h2>{collection1?.collection?.name}</h2>
                </div>
              </ContextMenu>
              <ContextMenu item={collection2} order={5} data-aos="fade-right" data-aos-duration="1500">
                <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0 flex-xl-row-reverse">
                  <ImageHover
                    className="col-12 col-xl-6"
                    style={{ alignSelf: isMobile ? 'center' : 'end' }}
                    href={getHref(collection2)}
                    height={height}
                    width={width}
                    images={collection2?.images ?? []}
                    name={collection2?.name}
                    rating={collection2 ? { rating: collection2.rating, grades: collection2.grades } : undefined}
                    description={tPrice('price', { price: collection2 ? collection2.price - collection2.discountPrice : 0 })}
                  />
                  <h2>{collection2?.collection?.name}</h2>
                </div>
              </ContextMenu>
              <ContextMenu item={collection3} order={6} data-aos="fade-right" data-aos-duration="1500">
                <div className="d-flex flex-column flex-column-reverse flex-xl-row justify-content-between align-items-center align-items-xl-end gap-5 gap-xl-0 flex-xl-row-reverse">
                  <ImageHover
                    className="col-12 col-xl-6"
                    style={{ alignSelf: isMobile ? 'center' : 'end' }}
                    href={getHref(collection3)}
                    height={height}
                    width={width}
                    images={collection3?.images ?? []}
                    name={collection3?.name}
                    rating={collection3 ? { rating: collection3.rating, grades: collection3.grades } : undefined}
                    description={tPrice('price', { price: collection3 ? collection3.price - collection3.discountPrice : 0 })}
                  />
                  <h2>{collection3?.collection?.name}</h2>
                </div>
              </ContextMenu>
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
              <h2 className="col-12 col-xl-4 text-center">{t('glassesChains')}</h2>
              <ContextMenu className="col-12 col-xl-4" image={coverImage6} cover={6} data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className={isMobile ? 'align-items-center' : ''}
                  width={coverSize.width}
                  height={coverSize.height}
                  images={(coverImage6 ? [coverImage6] : [])}
                />
              </ContextMenu>
            </div>
            <div className="d-flex flex-column flex-xl-row align-items-center gap-5 gap-xl-0">
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
            </div>
          </section>
          <section className="d-flex flex-column align-items-center col-12 text-center" data-aos="fade-right" data-aos-duration="1500">
            <div className="font-mr_hamiltoneg fs-1 fw-bold mb-5">{t('iEmphasizeYourIndividuality')}</div>
            <p className="fw-light fs-5 mb-2">
              <span>{t('subscribe')}</span>
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
