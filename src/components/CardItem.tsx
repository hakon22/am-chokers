import { useTranslation } from 'react-i18next';
import { Button, FloatButton, Input, Modal, Popconfirm, Rate, Tag } from 'antd';
import { DeleteOutlined, EllipsisOutlined, LikeOutlined, SignatureOutlined, UndoOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState, useContext } from 'react';
import ImageGallery from 'react-image-gallery';
import Link from 'next/link';
import cn from 'classnames';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import moment from 'moment';
import Image from 'next/image';
import { Telegram } from 'react-bootstrap-icons';

import telegramIcon from '@/images/icons/telegram.svg';
import { Favorites } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';
import { GradeList } from '@/components/GradeList';
import { deleteItem, type ItemResponseInterface, removeSpecialItem, publishItem, restoreItem, setPaginationParams, addSpecialItem } from '@/slices/appSlice';
import { routes } from '@/routes';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import CreateItem from '@/pages/admin/item';
import { booleanSchema } from '@server/utilities/convertation.params';
import { Helmet } from '@/components/Helmet';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { toast } from '@/utilities/toast';
import { ItemContext, MobileContext, SubmitContext } from '@/components/Context';
import { getHeight } from '@/utilities/screenExtension';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationInterface } from '@/types/PaginationInterface';

interface AdminControlGroupInterface {
  item: ItemInterface;
  setItem: React.Dispatch<React.SetStateAction<ItemInterface>>;
}

const PublishModal = ({ description, isPublish, setIsPublish, setDescription, onPublish }: { description: string; isPublish: boolean; setIsPublish: React.Dispatch<React.SetStateAction<boolean>>; setDescription: React.Dispatch<React.SetStateAction<string>>; onPublish: () => void }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  return (
    <Modal
      title={t('enterDescription')}
      centered
      zIndex={10000}
      open={isPublish}
      onOk={onPublish}
      okText={t('publishToTelegram')}
      cancelText={t('cancel')}
      onClose={() => setIsPublish(false)}
      onCancel={() => setIsPublish(false)}
    >
      <Input.TextArea value={description} onChange={(({ target }) => setDescription(target.value))} rows={6} placeholder={t('enterDescription')} />
    </Modal>
  );
};

const AdminControlGroup = ({ item, setItem }: AdminControlGroupInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const dispatch = useAppDispatch();

  const [isPublish, setIsPublish] = useState(false);
  const [description, setDescription] = useState(item.description);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const { role } = useAppSelector((state) => state.user);

  const restoreItemHandler = async () => {
    setIsSubmit(true);
    const { payload } = await dispatch(restoreItem(item.id)) as { payload: ItemResponseInterface; };
    if (payload.code === 1) {
      setItem(payload.item);
    }
    setIsSubmit(false);
  };

  const deleteItemHandler = async () => {
    setIsSubmit(true);
    const { payload } = await dispatch(deleteItem(item.id)) as { payload: ItemResponseInterface };
    if (payload.code === 1) {
      setItem(payload.item);
      toast(tToast('itemDeletedSuccess', { name: item.name }), 'success');
    }
    setIsSubmit(false);
  };

  const onEdit = () => router.push({
    pathname: router.pathname,
    query: { ...router.query, edit: true },
  }, undefined, { shallow: true });

  const onPublish = async () => {
    setIsSubmit(true);
    const { payload } = await dispatch(publishItem({ id: item.id, description })) as { payload: ItemResponseInterface & { error: string; } };
    if (!payload?.error) {
      setItem(payload.item);
      setIsPublish(false);
      toast(tToast('itemPublishSuccess', { name }), 'success');
    }
    setIsSubmit(false);
  };

  return role === UserRoleEnum.ADMIN
    ? isMobile
      ? (
        <>
          <PublishModal description={description} isPublish={isPublish} setIsPublish={setIsPublish} setDescription={setDescription} onPublish={onPublish} />
          <FloatButton.Group
            trigger="click"
            style={{ insetInlineEnd: 24, top: '70%', height: 'min-content' }}
            icon={<EllipsisOutlined />}
          >
            <FloatButton onClick={onEdit} icon={<SignatureOutlined />} />
            {item.deleted ? <FloatButton onClick={restoreItemHandler} icon={<UndoOutlined />} /> : <FloatButton onClick={deleteItemHandler} icon={<DeleteOutlined />} />}
            {!item.message ? <FloatButton onClick={() => setIsPublish(true)} className="float-custom-icon" icon={<Image src={telegramIcon} width={40} height={40} alt="Telegram" />} /> : <FloatButton className="float-custom-icon" icon={<Telegram width={40} height={40} color="green" />} />}
          </FloatButton.Group>
        </>
      )
      : (
        <>
          <PublishModal description={description} isPublish={isPublish} setIsPublish={setIsPublish} setDescription={setDescription} onPublish={onPublish} />
          <Button type="text" className="action-button edit" onClick={onEdit}>{t('edit')}</Button>
          {item.deleted
            ? <Button type="text" className="action-button restore" onClick={restoreItemHandler}>{t('restore')}</Button>
            : (
              <Popconfirm key="remove" title={t('removeTitle')} description={t('removeDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={deleteItemHandler}>
                <Button type="text" className="action-button remove">{t('remove')}</Button>
              </Popconfirm>
            )}
          {!item.message?.created
            ? <Button type="text" className="action-button send-to-telegram" onClick={() => setIsPublish(true)}>{t('publishToTelegram')}</Button>
            : <Tag color="success" className="fs-6" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>{t('publish', { date: moment(item.message?.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}</Tag>}
        </>
      ) : null;
};

export const CardItem = ({ item: fetchedItem, paginationParams }: { item: ItemInterface; paginationParams: PaginationInterface; }) => {
  const { id, collection, images, name, description, price, discountPrice, compositions, length, rating } = fetchedItem;

  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tDelivery } = useTranslation('translation', { keyPrefix: 'pages.delivery' });

  const galleryRef = useRef<ImageGallery>(null);

  const dispatch = useAppDispatch();

  const { role } = useAppSelector((state) => state.user);
  const { cart } = useAppSelector((state) => state.cart);
  const { specialItems, pagination } = useAppSelector((state) => state.app);

  const urlParams = useSearchParams();
  const editParams = urlParams.get('edit');

  const grade = rating?.rating ?? 0;

  const { setItem: setContextItem } = useContext(ItemContext);
  const { isMobile } = useContext(MobileContext);

  const [item, setItem] = useState(fetchedItem);
  const [tab, setTab] = useState<'delivery' | 'warranty'>();
  const [isEdit, setEdit] = useState<boolean | undefined>();
  const [originalHeight, setOriginalHeight] = useState(416);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(isMobile ? isMobile : true);

  const inCart = cart.find((cartItem) => cartItem.item.id === item.id);

  const updateItem = (value: ItemInterface) => {
    setItem(value);
    setContextItem(value);
    if (!value.new && !value.collection && !value.bestseller) {
      dispatch(removeSpecialItem(value));
    } else if ((value.new || value.collection || value.bestseller) && !specialItems.find((specialItem) => specialItem.id === value.id)) {
      dispatch(addSpecialItem(value));
    }
  };

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
    dispatch(setPaginationParams(paginationParams));
  }, [paginationParams]);

  useEffect(() => {
    setContextItem(item);

    return () => {
      setContextItem(undefined);
    };
  }, []);

  return isEdit ? <CreateItem oldItem={item} updateItem={updateItem} /> : (
    <div className="d-flex flex-column" style={isMobile ? { marginTop: '100px' } : {}}>
      <Helmet title={name} description={description} image={images?.[0]?.src} />
      <div className="d-flex flex-column flex-xl-row gap-xl-5 mb-5">
        {isMobile
          ? (
            <>
              <h1 className="mb-4 fs-3">{name}</h1>
              {collection
                ? <div><Tag color="#eaeef6" className="mb-4 py-1 px-2 fs-6" style={{ color: '#3b6099' }}>{t('collection', { name: collection.name })}</Tag></div>
                : null}
            </>
          )
          : null}
        <div className="d-flex flex-column justify-content-center align-items-center gap-3">
          <ImageGallery
            ref={galleryRef}
            additionalClass={cn('w-100 mb-5 mb-xl-0', { 'image-label': !!item.deleted })}
            showIndex
            items={images.sort((a, b) => a.order - b.order).map((image) => ({ original: image.src, thumbnail: image.src, originalHeight: isMobile && originalHeight !== getHeight() ? undefined : originalHeight, originalWidth: isMobile && originalHeight === getHeight() ? originalHeight / 1.3 : undefined }))}
            infinite
            showBullets={isMobile}
            showNav={!isMobile}
            onScreenChange={(fullscreen) => {
              if (fullscreen) {
                setOriginalHeight(getHeight());
                document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 110px)');
                document.documentElement.style.setProperty('--galleryHeight', '100vh');
                if (isMobile) {
                  const div = document.querySelector('.image-gallery-slide-wrapper.image-gallery-thumbnails-right') as HTMLElement;
                  if (div) {
                    div.style.transition = '0.25s all';
                    div.style.width = 'calc(100% - 30px)';
                  }
                  document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 30px)');
                  setShowThumbnails(false);
                }
              } else {
                setOriginalHeight(416);
                document.documentElement.style.setProperty('--galleryWidth', '320px');
                document.documentElement.style.setProperty('--galleryHeight', '416px');
                if (isMobile) {
                  const div = document.querySelector('.image-gallery-slide-wrapper.image-gallery-thumbnails-right') as HTMLElement;
                  if (div) {
                    div.style.width = '';
                    div.style.transition = '';
                  }
                  document.documentElement.style.setProperty('--galleryWidth', '320px');
                  setShowThumbnails(true);
                }
              }
            }}
            showThumbnails={showThumbnails}
            showPlayButton={false}
            thumbnailPosition={isMobile ? 'right' : 'left'}
            onClick={() => galleryRef.current?.fullScreen()}
          />
          {!isMobile
            ? (
              <div className="d-flex justify-content-center" style={{ width: '320px', alignSelf: 'end' }}>
                <div className="d-flex justify-content-between w-100">
                  <Button type="text" onClick={() => setTab('warranty')} className={cn('text-muted fs-6 fs-xxl-5 py-3 py-xxl-4 px-3 px-xxl-3', { disabled: tab === 'delivery' })}>{t('warrantyAndCare')}</Button>
                  <Button type="text" onClick={() => setTab('delivery')} className={cn('text-muted fs-6 fs-xxl-5 py-3 py-xxl-4 px-3 px-xxl-3', { disabled: tab === 'warranty' })}>{t('deliveryAndPayment')}</Button>
                </div>
              </div>
            ) : null}
        </div>
        <div style={{ width: isMobile ? '100%' : '55%' }}>
          <div className="d-flex flex-column">
            {!isMobile
              ? (
                <><h1 className="mb-4 fs-3">{name}</h1>
                  {collection
                    ? <div><Tag color="#eaeef6" className="mb-4 py-1 px-2 fs-6" style={{ color: '#3b6099' }}>{t('collection', { name: collection.name })}</Tag></div>
                    : null}
                </>)
              : null}
            <div className={cn('d-flex align-items-center gap-4 mb-4', { 'order-1': isMobile })}>
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
            <div className={cn('d-flex gap-5 mb-4', { 'order-0': isMobile })}>
              <div className="d-flex gap-3">
                {discountPrice ? <p className="fs-5 m-0">{t('price', { price: price - discountPrice })}</p> : null}
                <p className={cn('fs-5 m-0', { 'text-muted text-decoration-line-through fw-light': discountPrice })}>{t('price', { price })}</p>
              </div>
              {isMobile ? <Favorites id={id} /> : null}
              <AdminControlGroup item={item} setItem={setItem} />
            </div>
            {isMobile
              ? showThumbnails
                ? (
                  <div className="float-control-cart d-flex align-items-center justify-content-center gap-5" style={{ backgroundColor: inCart ? '#eaeef6' : '#2b3c5f', ...(inCart ? { border: '1px solid #c8c8c8' } : {}) }}>
                    <CartControl id={id} className="fs-5" classNameButton="w-100 h-100" />
                  </div>
                ) : null
              : (
                <div className="d-flex align-items-center gap-5 mb-3">
                  <CartControl id={id} className="fs-5" />
                  <Favorites id={id} />
                </div>
              )}
            <p className={cn('lh-lg', { 'order-2': isMobile })} style={{ letterSpacing: '0.5px' }}>{description}</p>
            <div className={cn('d-flex flex-column gap-3', { 'order-3': isMobile })}>
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
      <div className="d-flex justify-content-end mb-3 mb-xl-5">
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
                <Link href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_MAIL}`} target="_blank" className="fw-bold">{process.env.NEXT_PUBLIC_CONTACT_MAIL}</Link>
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
              <p key={1} className="mb-4 fs-5 fw-bold">{tDelivery('delivery')}</p>
              <p key={2}>{tDelivery('1')}</p>
              <p key={3}>{tDelivery('2')}</p>
              <div key={4} className="mb-4">
                {tDelivery('3')}
                <br />
                {tDelivery('4')}
              </div>
              <div key={5}>
                {tDelivery('5')}
                <br />
                {tDelivery('6')}
              </div>
              <p key={6} className="my-4">{tDelivery('7')}</p>
              <p key={7} className="mb-4 fs-5 fw-bold">{tDelivery('8')}</p>
              <div key={8}>
                {tDelivery('9')}
                <br />
                {tDelivery('10')}
              </div>
            </div>
          )}
        </div>
      </div>
      <GradeList item={item} setItem={setItem} />
    </div>
  );
};
