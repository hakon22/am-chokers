import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Helmet } from '@/components/Helmet';
import choker from '@/images/choker.png';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { ImageHover } from '@/components/ImageHover';
import { useRef, WheelEvent } from 'react';
import Carousel from 'react-multi-carousel';
import { throttle } from 'lodash';
import { ArrowRight } from 'react-bootstrap-icons';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });

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
      id: 1, images: [choker2, choker3], height: 400, title: 'Информация о товаре 1', description: '1000 ₽', className: 'me-3',
    },
    {
      id: 2, images: [choker2, choker3], height: 400, title: 'Информация о товаре 2', description: '2000 ₽', className: 'me-3',
    },
    {
      id: 3, images: [choker2, choker3], height: 400, title: 'Информация о товаре 3', description: '3000 ₽', className: 'me-3',
    },
    {
      id: 4, images: [choker2, choker3], height: 400, title: 'Информация о товаре 4', description: '4000 ₽', className: 'me-3',
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

  return (
    <div className="d-flex justify-content-center" onWheel={handleWheel}>
      <Helmet title={t('title')} description={t('description')} />
      <div className="mb-5 col-12 d-flex flex-column align-items-center gap-3">
        <Image src={choker} alt={t('title')} className="pe-none animate__animated animate__fadeInDownBig" priority style={{ zIndex: 2 }} />
        <div className="index-block-container">
          <section className="d-flex flex-column position-relative" data-aos="fade-right" data-aos-duration="1500">
            <div className="d-flex justify-content-between col-11">
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
                  <ImageHover
                    key={item.id}
                    className={item.className}
                    height={item.height}
                    images={item.images}
                    title={item.title}
                    description={item.description}
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
                <ImageHover
                  className="col-6 align-self-start"
                  height={200}
                  images={[choker2, choker3]}
                  title="Информация о товаре"
                  description="5000 &#8381;"
                  width="95%"
                />
                <ImageHover
                  className="col-6 d-flex align-self-end"
                  style={{ alignSelf: 'end' }}
                  height={200}
                  images={[choker2, choker3]}
                  title="Информация о товаре"
                  description="5000 &#8381;"
                  width="95%"
                />
              </div>
              <div className="d-flex col-6">
                <ImageHover
                  className="w-100"
                  height="100%"
                  images={[choker2, choker3]}
                  title="Информация о товаре"
                  description="5000 &#8381;"
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
                  images={[choker2, choker3]}
                />
                <h2>Название</h2>
              </div>
              <div className="d-flex flex-row-reverse justify-content-between align-items-end" data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className="col-6"
                  height={200}
                  images={[choker2, choker3]}
                />
                <h2>Название</h2>
              </div>
              <div className="d-flex flex-row-reverse justify-content-between align-items-end" data-aos="fade-left" data-aos-duration="1500">
                <ImageHover
                  className="col-6"
                  height={200}
                  images={[choker2, choker3]}
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
                images={[choker2, choker3]}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('necklacesAndChokers')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('bracelets')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('glassesChains')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
                data-aos="fade-left"
                data-aos-duration="1500"
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
                data-aos="fade-right"
                data-aos-duration="1500"
              />
              <h2 className="col-4 text-center">{t('otherAccessories')}</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
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
