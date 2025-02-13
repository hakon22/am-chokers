import { useTranslation } from 'react-i18next';
import { Button, Popconfirm, Rate, Tag } from 'antd';
import { LikeOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import Link from 'next/link';
import cn from 'classnames';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import moment from 'moment';

import { Favorites } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';
import { GradeList } from '@/components/GradeList';
import { deleteItem, type ItemResponseInterface, publishItem, setItemGrades } from '@/slices/appSlice';
import { routes } from '@/routes';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import CreateItem from '@/pages/admin/item';
import { booleanSchema } from '@server/utilities/convertation.params';
import { Helmet } from '@/components/Helmet';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { toast } from '@/utilities/toast';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationInterface } from '@/types/PaginationInterface';

export const CardItem = ({ item, paginationParams }: { item: ItemInterface; paginationParams: PaginationInterface }) => {
  const { id, images, name, description, price, compositions, length, rating, grades } = item;

  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tDelivery } = useTranslation('translation', { keyPrefix: 'pages.delivery' });

  const galleryRef = useRef<ImageGallery>(null);

  const dispatch = useAppDispatch();

  const { role } = useAppSelector((state) => state.user);
  const { items, pagination } = useAppSelector((state) => state.app);

  const router = useRouter();
  const urlParams = useSearchParams();
  const editParams = urlParams.get('edit');

  const grade = rating?.rating ?? 0;

  const currentItem = items.find(({ id: stateId }) => stateId === id);

  const [tab, setTab] = useState<'delivery' | 'warranty'>();
  const [isEdit, setEdit] = useState<boolean | undefined>();
  const [originalHeight, setOriginalHeight] = useState(400);

  const scrollToElement = (elementId: string, offset: number) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (role === UserRoleEnum.ADMIN) {
      setEdit(booleanSchema.validateSync(editParams));
    }
  }, [editParams, role]);

  useEffect(() => {
    dispatch(setItemGrades({ id, items: grades, paginationParams, code: 1 }));
  }, [items.length]);

  return isEdit ? <CreateItem oldItem={item} /> : (
    <div className="d-flex flex-column">
      <Helmet title={name} description={description} image={images?.[0]?.src} />
      <div className="d-flex mb-5">
        <div className="d-flex flex-column gap-3" style={{ width: '45%' }}>
          <ImageGallery
            ref={galleryRef}
            additionalClass="w-100"
            showIndex
            items={images.sort((a, b) => a.order - b.order).map((image) => ({ original: image.src, thumbnail: image.src, originalHeight }))}
            infinite
            showNav
            onScreenChange={(fullscreen) => {
              if (fullscreen) {
                setOriginalHeight(1000);
                document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 110px)');
                document.documentElement.style.setProperty('--galleryHeight', '100vh');
              } else {
                setOriginalHeight(400);
                document.documentElement.style.setProperty('--galleryWidth', 'calc(80% - 110px)');
                document.documentElement.style.setProperty('--galleryHeight', '400px');
              }
            }}
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
            <div className="d-flex align-items-center gap-4 mb-4">
              <div className="d-flex align-items-center gap-2" title={grade.toString()}>
                <Rate disabled allowHalf value={grade} />
                <span>{grade}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <LikeOutlined />
                {pagination.count
                  ? <button
                    className="icon-button text-muted"
                    style={{ color: '#393644' }}
                    type="button"
                    title={t('grades.gradeCount', { count: pagination.count })}
                    onClick={() => scrollToElement('grades', 120)}>
                    {t('grades.gradeCount', { count: pagination.count })}
                  </button>
                  : <span>{t('grades.gradeCount', { count: pagination.count })}</span>}
              </div>
            </div>
            <div className="d-flex gap-5 mb-4">
              <p className="fs-5 m-0">{t('price', { price })}</p>
              {role === UserRoleEnum.ADMIN
                ? (
                  <>
                    <Button type="text" className="action-button edit" onClick={() => {
                      router.push({
                        pathname: router.pathname,
                        query: { ...router.query, edit: true },
                      }, undefined, { shallow: true });
                    }}>{t('edit')}</Button>
                    <Popconfirm key="remove" title={t('removeTitle')} description={t('removeDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={() => {
                      dispatch(deleteItem(id));
                      router.back();
                      toast(tToast('itemDeletedSuccess', { name }), 'success');
                    }}>
                      <Button type="text" className="action-button remove">{t('remove')}</Button>
                    </Popconfirm>
                    {!currentItem?.message?.created
                      ? <Button
                        type="text"
                        className="action-button send-to-telegram"
                        onClick={async () => {
                          const { payload } = await dispatch(publishItem(id)) as { payload: ItemResponseInterface & { error: string; } };
                          if (!payload?.error) {
                            toast(tToast('itemPublishSuccess', { name }), 'success');
                          }
                        }}>
                        {t('publishToTelegram')}
                      </Button>
                      : <Tag color="success" className="fs-6" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>{t('publish', { date: moment(item.message?.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}</Tag>}
                  </>
                )
                : null}
            </div>
            <div className="d-flex align-items-center gap-5 mb-3">
              <CartControl id={id} className="fs-5" />
              <Favorites id={id} />
            </div>
            <p className="lh-lg" style={{ letterSpacing: '0.5px' }}>{description}</p>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-column gap-2">
                <span>{t('composition')}</span>
                <span>{compositions.map((composition) => composition.name).join(', ')}</span>
              </div>
              <div className="d-flex flex-column gap-2">
                <span>{t('length')}</span>
                <span>{length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end mb-5">
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
                <b><Link href={routes.jewelryCarePage} title={t('warranty.12')}>{t('warranty.12')}</Link></b>
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
              <p key={1} className="mb-4 fs-5 fw-bold">{tDelivery('1')}</p>
              <p key={2}>{tDelivery('2')}</p>
              <div key={3} className="mb-4">
                {tDelivery('3')}
                <br />
                {tDelivery('4')}
              </div>
              <div key={4}>
                {tDelivery('5')}
                <br />
                {tDelivery('6')}
              </div>
              <p key={5} className="my-4 fs-5 fw-bold">{tDelivery('7')}</p>
              <p key={6} className="mb-4">{tDelivery('8')}</p>
              <div key={7}>
                {tDelivery('9')}
                <br />
                {tDelivery('10')}
              </div>
            </div>
          )}
        </div>
      </div>
      {currentItem && <GradeList item={currentItem} />}
    </div>
  );
};
