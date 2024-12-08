import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect, useRef, useState, WheelEvent,
} from 'react';
import Carousel from 'react-multi-carousel';
import { throttle } from 'lodash';
import { ArrowRight } from 'react-bootstrap-icons';

import pendant from '@/images/pendant.png';
import choker from '@/images/choker.png';
import { ImageHover } from '@/components/ImageHover';
import { routes } from '@/routes';
import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/utilities/hooks';
import type { ItemInterface } from '@/types/item/Item';
import { ContextMenu } from '@/components/ContextMenu';
import { getHref } from '@/utilities/getHref';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const { items } = useAppSelector((state) => state.app);

  const [isLoaded, setIsLoaded] = useState(false);

  const { bestsellers, collections, news } = items.reduce((acc, item) => {
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

  const bestseller1 = bestsellers.find(({ order }) => order === 1);
  const bestseller2 = bestsellers.find(({ order }) => order === 2);
  const bestseller3 = bestsellers.find(({ order }) => order === 3);

  const collection1 = collections.find(({ order }) => order === 4);
  const collection2 = collections.find(({ order }) => order === 5);
  const collection3 = collections.find(({ order }) => order === 6);

  const carouselRef = useRef<Carousel>(null);

  const responsive = {
    desktop: {
      breakpoint: {
        max: 3000,
        min: 1024,
      },
      items: 3,
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
    setTimeout(setIsLoaded, 1000, true);
  }, []);

  return (
    <div className="d-flex justify-content-center" onWheel={handleWheel}>
      <Helmet title={t('title')} description={t('description')} />
      <Link href={routes.catalog} title="Смотреть каталог" className="button border-button position-absolute" style={{ borderRadius: '6px', top: '150px', padding: '0.5rem 0.7rem' }}>Смотреть каталог</Link>
      {isLoaded && (
        <>
          <div className="position-absolute top-0 pe-none animate__animated animate__fadeInDownBig" style={{ zIndex: 3, height: '62vh', width: '55%' }}>
            <Image src={choker} unoptimized fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} alt={t('title')} priority />
          </div>
          <div className="position-absolute top-0 pe-none animate__animated animate__fadeInDownBig" style={{ zIndex: 2, height: '105vh', width: '60%' }}>
            <Image src={pendant} unoptimized fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} alt={t('title')} priority />
          </div>
        </>
      )}
      <div className="mb-5 col-12 d-flex flex-column align-items-center gap-3">
        <div className="index-block-container">
          <section className="d-flex flex-column position-relative" data-aos="fade-right" data-aos-duration="1500">
            <div className="d-flex justify-content-between col-12">
              <h2 className="d-flex align-items-end col-2">{t('newItems')}</h2>
              <Carousel
                autoPlaySpeed={3000}
                centerMode={false}
                containerClass="col-12 index-block-container-carousel"
                draggable={false}
                focusOnSelect={false}
                infinite
                ref={carouselRef}
                arrows={false}
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
                    className={item.className}
                    href={getHref(item)}
                    height={item.height}
                    images={item.images}
                    name={item.name}
                    description={tPrice('price', { price: item.price })}
                  />
                ))}
              </Carousel>
            </div>
            <Link href="/" className="see-all color-dark-blue icon-button">
              <span>{t('seeAll')}</span>
              <ArrowRight />
            </Link>
          </section>
          <section className="d-flex flex-column col-11" data-aos="fade-right" data-aos-duration="1500" style={{ gap: '4rem' }}>
            <h2>{t('bestsellers')}</h2>
            <div className="d-flex" style={{ gap: '10%' }}>
              <div className="d-flex flex-column col-4 gap-5 justify-content-between">
                <ContextMenu item={bestseller1} order={1} className="col-6 align-self-start" style={{ width: '95%' }}>
                  <ImageHover
                    height={200}
                    href={getHref(bestseller1)}
                    images={bestseller1?.images ?? []}
                    name={bestseller1?.name}
                    description={tPrice('price', { price: bestseller1?.price })}
                  />
                </ContextMenu>
                <ContextMenu item={bestseller2} order={2} className="col-6 d-flex align-self-end">
                  <ImageHover
                    className="w-100"
                    href={getHref(bestseller2)}
                    style={{ alignSelf: 'end', width: '95%' }}
                    height={200}
                    images={bestseller2?.images ?? []}
                    name={bestseller2?.name}
                    description={tPrice('price', { price: bestseller2?.price })}
                  />
                </ContextMenu>
              </div>
              <div className="d-flex col-6">
                <ContextMenu item={bestseller3} order={3} className="w-100">
                  <ImageHover
                    className="h-100"
                    href={getHref(bestseller3)}
                    style={{ width: '100%' }}
                    height="100%"
                    images={bestseller3?.images ?? []}
                    name={bestseller3?.name}
                    description={tPrice('price', { price: bestseller3?.price })}
                  />
                </ContextMenu>
              </div>
            </div>
          </section>
          <section className="d-flex flex-column align-items-center col-12" data-aos="fade-left" data-aos-duration="1500" style={{ gap: '10rem' }}>
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
            <h2 className="col-10 text-start" style={{ marginBottom: '7%' }}>{t('collections')}</h2>
            <div className="d-flex flex-column col-10" style={{ gap: '5rem' }}>
              <ContextMenu item={collection1} order={4} data-aos="fade-right" data-aos-duration="1500">
                <div className="d-flex justify-content-between align-items-end">
                  <ImageHover
                    className="col-6"
                    href={getHref(collection1)}
                    height={200}
                    images={collection1?.images ?? []}
                  />
                  <h2>{collection1?.collection.name}</h2>
                </div>
              </ContextMenu>
              <ContextMenu item={collection2} order={5} data-aos="fade-right" data-aos-duration="1500">
                <div className="d-flex justify-content-between align-items-end flex-row-reverse">
                  <ImageHover
                    className="col-6"
                    href={getHref(collection2)}
                    height={200}
                    images={collection2?.images ?? []}
                  />
                  <h2>{collection2?.collection.name}</h2>
                </div>
              </ContextMenu>
              <ContextMenu item={collection3} order={6} data-aos="fade-right" data-aos-duration="1500">
                <div className="d-flex justify-content-between align-items-end flex-row-reverse">
                  <ImageHover
                    className="col-6"
                    href={getHref(collection3)}
                    height={200}
                    images={collection3?.images ?? []}
                  />
                  <h2>{collection3?.collection.name}</h2>
                </div>
              </ContextMenu>
            </div>
          </section>
          <section className="d-flex flex-column col-12 gap-5">
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={items[0]?.images ?? []}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('necklacesAndChokers')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={items[1]?.images ?? []}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={items[0]?.images ?? []}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('bracelets')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={items[0]?.images ?? []}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={items[0]?.images ?? []}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('glassesChains')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={items[0]?.images ?? []}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={items[0]?.images ?? []}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('otherAccessories')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={items[0]?.images ?? []}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
          </section>
          <section className="d-flex flex-column align-items-center col-12" data-aos="fade-right" data-aos-duration="1500">
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
