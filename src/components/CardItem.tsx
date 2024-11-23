import { useTranslation } from 'react-i18next';
import { Button, Rate } from 'antd';
import { useRef, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import { HeartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import cn from 'classnames';

import type { ItemInterface } from '@/types/item/Item';

export const CardItem = ({
  images, name, description, price, composition, length, rating,
}: ItemInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const galleryRef = useRef<ImageGallery>(null);

  const [tab, setTab] = useState<'delivery' | 'warranty'>();

  return (
    <div className="d-flex flex-column">
      <div className="d-flex mb-5">
        <div className="d-flex flex-column gap-3" style={{ width: '45%' }}>
          <ImageGallery
            ref={galleryRef}
            additionalClass="w-100"
            items={[...images, ...images, ...images, ...images].sort((a, b) => a.order - b.order).map((image) => ({ original: `${image.path}/${image.name}`, thumbnail: `${image.path}/${image.name}` }))}
            infinite
            showNav
            onScreenChange={(fullscreen) => (fullscreen ? document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 110px)') : document.documentElement.style.setProperty('--galleryWidth', 'calc(80% - 110px)'))}
            showPlayButton={false}
            thumbnailPosition="left"
            onClick={() => galleryRef.current?.fullScreen()}
          />
          <div className="d-flex justify-content-end" style={{ width: '80%' }}>
            <div className="d-flex justify-content-between" style={{ width: 'calc(100% - 110px)' }}>
              <Button type="text" onClick={() => setTab('warranty')} className={cn('text-muted fs-6 fs-xxl-5 py-3 py-xxl-4 px-3 px-xxl-4', { disabled: tab === 'delivery' })}>{t('warrantyAndCare')}</Button>
              <Button type="text" onClick={() => setTab('delivery')} className={cn('text-muted fs-6 fs-xxl-5 py-3 py-xxl-4 px-3 px-xxl-4', { disabled: tab === 'warranty' })}>{t('deliveryAndPayment')}</Button>
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
      <div className="d-flex justify-content-end">
        <div className="col-11 d-flex flex-column justify-content-end">
          {tab === 'warranty' ? (
            <div className="warranty-fade">
              <p>На все украшения, приобретенные в нашем магазине, мы даем гарантию 1 месяц с момента покупки при соблюдении наших рекомендаций.</p>
              <div>
                Стирание покрытия - это не дефект, а естественный износ украшения, признак того, что вы любите украшение и часто его носите.
                <br />
                Если в течение этого периода украшения сломаются, мы отремонтируем их абсолютно бесплатно.
                <br />
                Гарантийный случай наступает только при наличии чека и распространяется на крепления ниток камней, застежек, а также другие скрытые дефекты.
                <br />
              </div>
              <p className="my-4 fs-5 fw-bold">Гарантийное обслуживание не распространяется:</p>
              <div>
                - на истирание, потемнение покрытия, которое произошло в следствии естественного износа;
                <br />
                - на украшении есть следы механического повреждения (например, погнулось от удара);
                <br />
                - были нарушены условия хранения и уход;
                <br />
                - изменения произошли из-за естесвенного износа украшения;
                <br />
                - часть украшения: серьга, кулон или другая деталь потеряны.
                <br />
              </div>
              <p className="my-4">
                Для того, чтобы украшение служило Вам дольше, мы советуем следовать нашим
                <b> рекомендациям по уходу</b>
                .
              </p>
              <div>
                Если Вам все же необходимо воспользоваться гарантийным ремонтом украшений, отправьте фото поврежденных изделий с описанием проблемы на наш электронный адрес
                {' '}
                <Link href="mailto:amchokers@gmail.com" target="_blank" className="fw-bold">amchokers@gmail.com</Link>
                {' '}
                или в Телеграм
                {' '}
                <Link href="https://t.me/AMChokers" target="_blank" className="fw-bold">@KS_Mary</Link>
                .
                <br />
                Мы свяжемся с Вами для уточнения деталей. Доставка поврежденных изделий осуществляется за счет Покупателя.
                <br />
                Гарантийный период – это срок, во время которого клиент, обнаружив недостаток товара, имеет право потребовать от продавца или изготовителя принять меры по устранению дефекта.
                <br />
                Продавец должен устранить недостатки, если не будет доказано, что они возникли вследствие нарушений покупателем правил эксплуатации.
                <br />
              </div>
            </div>
          ) : tab === 'delivery' && (
            <div className="delivery-fade">
              <p key={1} className="mb-4 fs-5 fw-bold">ДОСТАВКА</p>
              <p key={2}>При заказе от 8000 руб. отправляем изделия до пункта СДЭК за наш счет.</p>
              <div key={3} className="mb-4">
                Сбор и отправка заказа осуществяется в течение суток после оплаты заказа. Сроки доставки — от 2-х до 7-и рабочих дней, в зависимости от региона.
                <br />
                В предпраздничные дни сроки доставки могут быть увеличены.
              </div>
              <div key={4}>
                Доставка осуществляется с помощью транспортной службы СДЭК.
                <br />
                Срок и стоимость доставки рассчитываются автоматически при оформлении заказа, когда вы вводите свои данные.
              </div>
              <p key={5} className="my-4 fs-5 fw-bold">ОПЛАТА</p>
              <p key={6} className="mb-4">Оплатить заказ можно на сайте банковской картой VISA, Mastercard или МИР через сервис безопасных платежей ЮКасса.</p>
              <div key={7}>
                Мы отправляем заказы по 100% предоплате с возможностью примерки и даём гарантию обмена или возврата средств в случае, если изделие не подойдет по
                <br />
                какой-то причине — 7 календарных дней с момента получения заказа (при условии сохранения товарного вида, целостности бирки и упаковки).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
