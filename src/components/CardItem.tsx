import { useTranslation } from 'react-i18next';
import { Button, Rate } from 'antd';
import { useEffect, useRef, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import Link from 'next/link';
import cn from 'classnames';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';

import type { ItemInterface } from '@/types/item/Item';
import { Favorites } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';
import { routes } from '@/routes';
import { useAppSelector } from '@/utilities/hooks';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import CreateItem from '@/pages/admin/item/new';
import { booleanSchema } from '@server/utilities/convertation.params';

export const CardItem = ({
  id, images, name, discount, discountPrice, description, price, composition, length, rating, ...rest
}: ItemInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const galleryRef = useRef<ImageGallery>(null);

  const { role } = useAppSelector((state) => state.user);

  const router = useRouter();
  const urlParams = useSearchParams();
  const editParams = urlParams.get('edit');

  const [tab, setTab] = useState<'delivery' | 'warranty'>();
  const [isEdit, setEdit] = useState<boolean | undefined>();

  useEffect(() => {
    if (role === UserRoleEnum.ADMIN) {
      setEdit(booleanSchema.validateSync(editParams));
    }
  }, [editParams, role]);

  return isEdit ? <CreateItem oldItem={{ id, images, name, discount, discountPrice, description, price, composition, length, rating, ...rest }} /> : (
    <div className="d-flex flex-column">
      <div className="d-flex mb-5">
        <div className="d-flex flex-column gap-3" style={{ width: '45%' }}>
          <ImageGallery
            ref={galleryRef}
            additionalClass="w-100"
            items={images.sort((a, b) => b.order - a.order).map((image) => ({ original: image.src, thumbnail: image.src }))}
            infinite
            showNav
            onScreenChange={(fullscreen) => (fullscreen ? document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 110px)') : document.documentElement.style.setProperty('--galleryWidth', 'calc(80% - 110px)'))}
            showPlayButton={false}
            thumbnailPosition="left"
            onClick={galleryRef.current?.fullScreen}
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
              <Rate disabled value={rating?.rating ?? 0} />
              <span>{rating?.rating ?? 0}</span>
            </div>
            <div className="d-flex gap-5">
              <p className="fs-5 mb-4">{t('price', { price })}</p>
              {role === UserRoleEnum.ADMIN ? <Button type="text" className="edit-button" onClick={() => {
                router.push({
                  pathname: router.pathname,
                  query: { ...router.query, edit: true },
                }, undefined, { shallow: true });
              }}>{t('edit')}</Button> : null}
            </div>
            <div className="d-flex align-items-center gap-5 mb-4">
              <CartControl id={id} name={name} className="fs-5" />
              <Favorites id={id} />
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
              <p>{t('warranty.1')}</p>
              <div>
                {t('warranty.2')}
                <br />
                {t('warranty.3')}
                <br />
                {t('warranty.4')}
                <br />
              </div>
              <p className="my-4 fs-5 fw-bold">{t('warranty.5')}</p>
              <div>
                {t('warranty.6')}
                <br />
                {t('warranty.7')}
                <br />
                {t('warranty.8')}
                <br />
                {t('warranty.9')}
                <br />
                {t('warranty.10')}
                <br />
              </div>
              <p className="my-4">
                {t('warranty.11')}
                <b>{t('warranty.12')}</b>
                .
              </p>
              <div>
                {t('warranty.13')}
                {' '}
                <Link href="mailto:amchokers@gmail.com" target="_blank" className="fw-bold">amchokers@gmail.com</Link>
                {' '}
                {t('warranty.14')}
                {' '}
                <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.homePage} target="_blank" className="fw-bold">@KS_Mary</Link>
                .
                <br />
                {t('warranty.15')}
                <br />
                {t('warranty.16')}
                <br />
                {t('warranty.17')}
                <br />
              </div>
            </div>
          ) : tab === 'delivery' && (
            <div className="delivery-fade">
              <p key={1} className="mb-4 fs-5 fw-bold">{t('delivery.1')}</p>
              <p key={2}>{t('delivery.2')}</p>
              <div key={3} className="mb-4">
                {t('delivery.3')}
                <br />
                {t('delivery.4')}
              </div>
              <div key={4}>
                {t('delivery.5')}
                <br />
                {t('delivery.6')}
              </div>
              <p key={5} className="my-4 fs-5 fw-bold">{t('delivery.7')}</p>
              <p key={6} className="mb-4">{t('delivery.8')}</p>
              <div key={7}>
                {t('delivery.9')}
                <br />
                {t('delivery.10')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
