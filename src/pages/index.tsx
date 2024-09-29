import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import pendant from '@/images/pendant.png';
import choker from '@/images/choker.png';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { ImageHover } from '@/components/ImageHover';
import {
  useEffect, useRef, useState, WheelEvent,
} from 'react';
import Carousel from 'react-multi-carousel';
import { throttle } from 'lodash';
import { ArrowRight } from 'react-bootstrap-icons';
import routes from '@/routes';
import translate from '@/utilities/translate';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const [isLoaded, setIsLoaded] = useState(false);

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

  const items = [
    {
      id: 1, images: [choker2.src, choker3.src], width: 400, height: 400, name: 'Товар 1', description: 'Lorem ipsum dolor sit amet consectetur. Mi rhoncus venenatis magna sagittis dignissim. Et sed nisi purus quis facilisi est. Massa eget vel eros facilisis etiam commodo.', price: 1000, rating: 1.3, composition: 'Стеклянный бисер, варисцит, гематит, кристаллы, бижутерный сплав', length: '40 см + регулировка 6 см', className: 'me-3', group: 'necklace',
    },
    {
      id: 2, images: [choker2.src, choker3.src], width: 400, height: 400, name: 'Товар 2', description: 'Lorem ipsum dolor sit amet consectetur. Mi rhoncus venenatis magna sagittis dignissim. Et sed nisi purus quis facilisi est. Massa eget vel eros facilisis etiam commodo.', price: 2000, rating: 2.3, composition: 'Стеклянный бисер, варисцит, гематит, кристаллы, бижутерный сплав', length: '40 см + регулировка 6 см', className: 'me-3', group: 'bracelets',
    },
    {
      id: 3, images: [choker2.src, choker3.src], width: 400, height: 400, name: 'Товар 3', description: 'Lorem ipsum dolor sit amet consectetur. Mi rhoncus venenatis magna sagittis dignissim. Et sed nisi purus quis facilisi est. Massa eget vel eros facilisis etiam commodo.', price: 3000, rating: 3.3, composition: 'Стеклянный бисер, варисцит, гематит, кристаллы, бижутерный сплав', length: '40 см + регулировка 6 см', className: 'me-3', group: 'earrings',
    },
    {
      id: 4, images: [choker2.src, choker3.src], width: 400, height: 400, name: 'Товар 4', description: 'Lorem ipsum dolor sit amet consectetur. Mi rhoncus venenatis magna sagittis dignissim. Et sed nisi purus quis facilisi est. Massa eget vel eros facilisis etiam commodo.', price: 4000, rating: 4.3, composition: 'Стеклянный бисер, варисцит, гематит, кристаллы, бижутерный сплав', length: '40 см + регулировка 6 см', className: 'me-3', group: 'accessories',
    },
  ];

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
      <Link href={routes.catalog} title="Смотреть каталог" className="button border-button fs-5 position-absolute" style={{ borderRadius: '6px', padding: '0.5rem 0.7rem' }}>Смотреть каталог</Link>
      {isLoaded && (
      <>
        <div className="position-absolute top-0 pe-none animate__animated animate__fadeInDownBig" style={{ zIndex: 3, height: '62vh', width: '55%' }}>
          <Image src={choker.src} unoptimized fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} alt={t('title')} priority />
        </div>
        <div className="position-absolute top-0 pe-none animate__animated animate__fadeInDownBig" style={{ zIndex: 2, height: '105vh', width: '60%' }}>
          <Image src={pendant.src} unoptimized fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} alt={t('title')} priority />
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
                {items.map((item) => (
                  <Link href={`${routes.catalog}/${item.group}/${translate(item.name)}`} key={item.id}>
                    <ImageHover
                      className={item.className}
                      height={item.height}
                      images={item.images}
                      name={item.name}
                      description={tPrice('price', { price: item.price })}
                    />
                  </Link>
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
                <ImageHover
                  className="col-6 align-self-start"
                  height={200}
                  images={[choker2.src, choker3.src]}
                  name="Информация о товаре"
                  description={tPrice('price', { price: 5000 })}
                  width="95%"
                />
                <ImageHover
                  className="col-6 d-flex align-self-end"
                  style={{ alignSelf: 'end' }}
                  height={200}
                  images={[choker2.src, choker3.src]}
                  name="Информация о товаре"
                  description={tPrice('price', { price: 5000 })}
                  width="95%"
                />
              </div>
              <div className="d-flex col-6">
                <ImageHover
                  className="w-100"
                  height="100%"
                  images={[choker2.src, choker3.src]}
                  name="Информация о товаре"
                  description={tPrice('price', { price: 5000 })}
                />
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
              <div className="d-flex justify-content-between align-items-end" data-aos="fade-right" data-aos-duration="1500">
                <ImageHover
                  className="col-6"
                  height={200}
                  images={[choker2.src, choker3.src]}
                />
                <h2>Название</h2>
              </div>
              <div className="d-flex flex-row-reverse justify-content-between align-items-end" data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className="col-6"
                  height={200}
                  images={[choker2.src, choker3.src]}
                />
                <h2>Название</h2>
              </div>
              <div className="d-flex flex-row-reverse justify-content-between align-items-end" data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className="col-6"
                  height={200}
                  images={[choker2.src, choker3.src]}
                />
                <h2>Название</h2>
              </div>
            </div>
          </section>
          <section className="d-flex flex-column col-12 gap-5">
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2.src, choker3.src]}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('necklacesAndChokers')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2.src, choker3.src]}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2.src, choker3.src]}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('bracelets')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2.src, choker3.src]}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2.src, choker3.src]}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('glassesChains')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2.src, choker3.src]}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2.src, choker3.src]}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('otherAccessories')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2.src, choker3.src]}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
          </section>
          <section className="d-flex flex-column align-items-center col-12" data-aos="fade-right" data-aos-duration="1500">
            <div className="font-mr_hamiltoneg fs-1 fw-bold mb-5">{t('iEmphasizeYourIndividuality')}</div>
            <p className="fw-light fs-5 mb-2">
              <span>{t('subscribe')}</span>
              <Link href="https://t.me/AMChokers" className="color-dark-blue icon-button ms-1" target="_blank">@AMChokers</Link>
            </p>
            <p className="fw-light fs-5">{t('getUpdates')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
