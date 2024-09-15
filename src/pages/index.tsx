import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Helmet } from '@/components/Helmet';
import choker from '@/images/choker.png';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { ImageHover } from '@/components/ImageHover';
import { useContext, useRef, WheelEvent } from 'react';
import Carousel from 'react-multi-carousel';
import { throttle } from 'lodash';
import { ArrowRight } from 'react-bootstrap-icons';
import { ScrollContext } from '@/components/Context';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });
  const router = useRouter();

  const scrollBar = useContext(ScrollContext);

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

  const handleWheel = throttle((event: WheelEvent<HTMLDivElement>) => {
    if (carouselRef.current) {
      if (event.deltaY > 0) {
        carouselRef.current.next(1);
      } else {
        carouselRef.current.previous(1);
      }
    }
  }, 1000);

  const telegramLink = () => router.push('https://t.me/AMChokers');

  return (
    <div className="d-flex justify-content-center" onWheel={handleWheel}>
      <Helmet title={t('title')} description={t('description')} />
      <div className="mb-5 col-12 d-flex flex-column align-items-center gap-3">
        <Image src={choker} alt={t('title')} className="pe-none" priority style={{ zIndex: 2 }} />
        <div className="index-block-container">
          <section className="d-flex flex-column">
            <div className="d-flex justify-content-between col-11">
              <h2 className="d-flex align-items-end col-2">Новинки</h2>
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
            <button className="see-all color-dark-blue icon-button" style={{ marginLeft: scrollBar ? `calc(${scrollBar} + 3px)` : 0 }} type="button">
              <span>Смотреть все</span>
              <ArrowRight />
            </button>
          </section>
          <section className="d-flex flex-column col-11" style={{ gap: '4rem' }}>
            <h2>Бестселлеры</h2>
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
          <section className="d-flex flex-column align-items-center col-12" style={{ gap: '10rem' }}>
            <h2 className="lh-base">
              СОЗДАЙ СВОЁ
              <br />
              УНИКАЛЬНОЕ УКРАШЕНИЕ
            </h2>
            <div className="guide col-10">
              <span className="guide-text lh-base fs-2">
                Текст что надо
                <br />
                сделать
              </span>
            </div>
          </section>
          <section className="d-flex flex-column align-items-center">
            <h2 className="col-10 text-start" style={{ marginBottom: '7%' }}>Коллекции</h2>
            <div className="d-flex flex-column col-10" style={{ gap: '5rem' }}>
              <div className="d-flex justify-content-between align-items-end">
                <ImageHover
                  className="col-6"
                  height={200}
                  images={[choker2, choker3]}
                />
                <h2>Название</h2>
              </div>
              <div className="d-flex flex-row-reverse justify-content-between align-items-end">
                <ImageHover
                  className="col-6"
                  height={200}
                  images={[choker2, choker3]}
                />
                <h2>Название</h2>
              </div>
              <div className="d-flex flex-row-reverse justify-content-between align-items-end">
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
              />
              <h2 className="col-4 text-center">Колье и чокеры</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
              />
              <h2 className="col-4 text-center">Браслеты</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
              />
              <h2 className="col-4 text-center">Цепочки для очков</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
              />
            </div>
            <div className="d-flex align-items-center">
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
              />
              <h2 className="col-4 text-center">Другие аксессуары</h2>
              <ImageHover
                className="col-4"
                height={200}
                images={[choker2, choker3]}
              />
            </div>
          </section>
          <section className="d-flex flex-column align-items-center col-12">
            <div className="font-mr_hamiltoneg fs-1 fw-bold mb-5">Подчёркиваю Вашу индивидуальность</div>
            <p className="fw-light fs-5 mb-2">
              <span>Подпишитесь на канал в Telegram</span>
              <button className="color-dark-blue icon-button ms-1" onClick={telegramLink} type="button">@AMChokers</button>
            </p>
            <p className="fw-light fs-5">чтобы первыми узнавать об акциях и новинках</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
