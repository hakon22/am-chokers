import { useTranslation } from 'react-i18next';
import { ItemType } from '@/types/item/ItemType';
import { Button, Rate } from 'antd';
import { useRef, useEffect, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import { HeartOutlined } from '@ant-design/icons';
import { Spinner } from 'react-bootstrap';

export const CardItem = ({
  images, name, description, price, composition, length, rating,
}: ItemType) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const galleryRef = useRef<ImageGallery>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
  }, []);

  return (
    <div className="d-flex mb-5">
      {!isLoading ? (
        <div className="position-absolute start-0 top-0 vw-100 vh-100" style={{ zIndex: 555 }}>
          <div className="spinner">
            <Spinner animation="border" variant="primary" role="status" />
          </div>
        </div>
      ) : null}
      <div className="d-flex flex-column gap-3" style={{ width: '45%' }}>
        <ImageGallery
          ref={galleryRef}
          additionalClass="w-100"
          items={[...images, ...images, ...images, ...images].map((image) => ({ original: image, thumbnail: image }))}
          infinite
          showNav
          onScreenChange={(fullscreen) => (fullscreen ? document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 110px)') : document.documentElement.style.setProperty('--galleryWidth', 'calc(80% - 110px)'))}
          showPlayButton={false}
          thumbnailPosition="left"
          onClick={() => galleryRef.current?.fullScreen()}
        />
        <div className="d-flex justify-content-end" style={{ width: '80%' }}>
          <div className="d-flex justify-content-between" style={{ width: 'calc(100% - 110px)' }}>
            <Button type="text" className="text-muted fs-5 py-4 px-3">{t('warrantyAndCare.title')}</Button>
            <Button type="text" className="text-muted fs-5 py-4 px-3">{t('deliveryAndPayment.title')}</Button>
          </div>
        </div>
      </div>
      <div style={{ width: '55%' }}>
        <div className="d-flex flex-column">
          <h1 className="mb-4 fs-3">{name}</h1>
          <div className="d-flex align-items-center gap-2 mb-4">
            <Rate disabled value={rating} />
            <span>{rating}</span>
          </div>
          <p className="fs-5 mb-4">{t('price', { price })}</p>
          <div className="d-flex align-items-center gap-5 mb-4">
            <Button className="button border-button fs-5">{t('addToCart')}</Button>
            <button className="icon-button" type="button">
              <HeartOutlined className="icon" />
              <span className="visually-hidden">{t('favorites')}</span>
            </button>
          </div>
          <p className="lh-lg" style={{ letterSpacing: '0.5px' }}>{description}</p>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-column gap-2">
              <span>{t('composition')}</span>
              <span>{composition}</span>
            </div>
            <div className="d-flex flex-column gap-2">
              <span>{t('length')}</span>
              <span>{length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
