import { useTranslation } from 'react-i18next';
import Image, { StaticImageData } from 'next/image';
import { Helmet } from '@/components/Helmet';
import choker from '@/images/choker.png';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { ImageHover } from '@/components/ImageHover';
import { useEffect, useState } from 'react';
import Carousel from 'react-multi-carousel';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });

  const items = [
    {
      id: 1, images: [choker2, choker3], height: 400, title: 'Информация о товаре 1', description: '1000 ₽', className: 'mx-3',
    },
    {
      id: 2, images: [choker2, choker3], height: 400, title: 'Информация о товаре 2', description: '2000 ₽', className: 'mx-3',
    },
    {
      id: 3, images: [choker2, choker3], height: 400, title: 'Информация о товаре 3', description: '3000 ₽', className: 'mx-3',
    },
    {
      id: 4, images: [choker2, choker3], height: 400, title: 'Информация о товаре 4', description: '4000 ₽', className: 'mx-3',
    },
  ];

  return (
    <div className="d-flex justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <div className="mb-5 col-12 d-flex flex-column align-items-center gap-3">
        <Image src={choker} alt={t('title')} className="pe-none" priority style={{ zIndex: 2 }} />
        <div className="index-block">
          <div className="d-flex col-11">
            <h2 className="d-flex align-items-end col-2">Новинки</h2>
            <Carousel
              autoPlaySpeed={3000}
              autoPlay
              centerMode={false}
              containerClass="col-12 index-block-carousel"
              draggable
              focusOnSelect={false}
              infinite
              arrows={false}
              minimumTouchDrag={80}
              partialVisible={false}
              renderArrowsWhenDisabled={false}
              renderButtonGroupOutside={false}
              renderDotsOutside={false}
              partialVisbile={false}
              responsive={{
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
              }}
              rewind={false}
              rewindWithAnimation={false}
              rtl={false}
              shouldResetAutoplay
              showDots={false}
              itemClass=""
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
          <div className="d-flex flex-column col-11" style={{ gap: '4rem' }}>
            <h2>Бестселлеры</h2>
            <div className="d-flex">
              <div className="d-flex flex-column col-4 row-gap-5">
                <ImageHover
                  className="col-6 align-self-start"
                  height={200}
                  images={[choker2, choker3]}
                  title="Информация о товаре"
                  description="5000 &#8381;"
                />
                <ImageHover
                  className="col-6 align-self-end"
                  height={200}
                  images={[choker2, choker3]}
                  title="Информация о товаре"
                  description="5000 &#8381;"
                />
              </div>
              <div className="col-1" />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
