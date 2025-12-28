import { useTranslation } from 'react-i18next';
import { Button, FloatButton, Input, Modal, Popconfirm, Rate, Tag, DatePicker, Form } from 'antd';
import { CloseOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined, LikeOutlined, RubyOutlined, SignatureOutlined, UndoOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState, useContext, useEffectEvent } from 'react';
import ImageGallery from 'react-image-gallery';
import Link from 'next/link';
import cn from 'classnames';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import moment, { type Moment } from 'moment';
import Image from 'next/image';
import { Telegram } from 'react-bootstrap-icons';
import Carousel from 'react-multi-carousel';
import axios from 'axios';

import telegramIcon from '@/images/icons/telegram.svg';
import { Favorites } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';
import { GradeList } from '@/components/GradeList';
import { TimePicker } from '@/components/TimePicker';
import { deleteItem, type ItemResponseInterface, type PublishTelegramInterface, publishItem, restoreItem, setPaginationParams, partialUpdateItem, type DeferredPublicationIResponsenterface } from '@/slices/appSlice';
import { routes } from '@/routes';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import CreateItem from '@/pages/admin/item';
import { booleanSchema } from '@server/utilities/convertation.params';
import { Helmet } from '@/components/Helmet';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { toast } from '@/utilities/toast';
import { ItemContext, MobileContext, SubmitContext } from '@/components/Context';
import { getHeight } from '@/utilities/screenExtension';
import { scrollToElement } from '@/utilities/scrollToElement';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { locale } from '@/locales/pickers.locale.ru';
import { publishTelegramValidation } from '@/validations/validations';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface, PaginationInterface } from '@/types/PaginationInterface';
import type { ItemTranslateEntity } from '@server/db/entities/item.translate.entity';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

interface AdminControlGroupInterface {
  item: ItemInterface;
  setItem: (value: ItemInterface) => void;
}

interface PublicationDateFormInterface {
  publicationDate: Date | null;
  publicationTime: string | null;
}

interface PublishModalInterface {
  publishData: PublishTelegramInterface;
  publicationDate: Date | null;
  setPublicationDate: React.Dispatch<React.SetStateAction<Date | null>>;
  isTgPublish: boolean;
  setIsTgPublish: React.Dispatch<React.SetStateAction<boolean>>;
  onPublish: (values: PublishTelegramInterface) => void;
  onPublicationDateUpdate: (values: PublicationDateFormInterface) => void;
  generateDescription: () => void; lang: UserLangEnum;
}

const PublishModal = ({ publishData, isTgPublish, publicationDate, setPublicationDate, onPublicationDateUpdate, setIsTgPublish, onPublish, generateDescription, lang }: PublishModalInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const [form] = Form.useForm<PublishTelegramInterface>();
  const [publicationDateForm] = Form.useForm<PublicationDateFormInterface>();

  const date = Form.useWatch('date', form);
  const publicationDateValue = Form.useWatch('publicationDate', publicationDateForm);

  const [time, setTime] = useState<string | null>(null);
  const [publicationTime, setPublicationTime] = useState<string | null>(null);

  const setPublicationTimeEffect = useEffectEvent(setPublicationTime);
  const setTimeEffect = useEffectEvent(setTime);

  const onTgFinish = () => {
    form.validateFields().then((values) => {
      if ([date, time].filter(Boolean).length === 1) {
        const name = date ? 'time' : 'date';
        form.setFields([{ name, errors: [tValidation('required')] }]);
      } else {
        values.time = time;
        onPublish(values);
      }
    });
  };

  const onPublicationDateFinish = () => {
    const values = publicationDateForm.getFieldsValue();
    if ([publicationDateValue, publicationTime].filter(Boolean).length === 1) {
      const name: keyof PublicationDateFormInterface = publicationDateValue ? 'publicationTime' : 'publicationDate';
      publicationDateForm.setFields([{ name, errors: [tValidation('required')] }]);
    } else {
      values.publicationTime = publicationTime;
      onPublicationDateUpdate(values);
    }
  };

  const handleTgCancel = () => {
    form.resetFields();
    setTime(null);
    setIsTgPublish(false);
  };

  const handlePublicationDateCancel = () => {
    publicationDateForm.resetFields();
    setPublicationTime(null);
    setPublicationDate(null);
  };

  useEffect(() => {
    if (isTgPublish) {
      setTimeEffect(publishData.time ? moment(publishData.time).format(DateFormatEnum.HH_MM) : null);
      form.resetFields();
      form.setFieldsValue(publishData);
    } else {
      form.resetFields();
      setTimeEffect(null);
    }
  }, [isTgPublish, publishData]);

  useEffect(() => {
    if (publicationDate) {
      setPublicationTimeEffect(publicationDate ? moment(publicationDate).format(DateFormatEnum.HH_MM) : null);
      publicationDateForm.resetFields();
      publicationDateForm.setFieldsValue({ 
        publicationDate, 
        publicationTime: moment(publicationDate).format(DateFormatEnum.HH_MM),
      });
    } else {
      publicationDateForm.resetFields();
      setPublicationTimeEffect(null);
    }
  }, [publicationDate]);

  useEffect(() => {
    form.setFieldValue('description', publishData.description);
  }, [publishData.description]);

  return isTgPublish
    ? (
      <Modal
        title={t('publishTitle')}
        centered
        zIndex={10000}
        classNames={{ header: 'text-center', footer: 'ant-input-group-addon' }}
        open={isTgPublish}
        onOk={onTgFinish}
        okText={t(date && time ? 'publishToTelegramLater' : 'publishToTelegramNow')}
        cancelText={t('cancel')}
        onCancel={handleTgCancel}
        footer={(_, { OkBtn, CancelBtn }) => (
          <div className="d-flex flex-column flex-xl-row justify-content-end gap-2 mt-4">
            {isTgPublish ? <Button style={{ background: 'linear-gradient(135deg,#fdd8a6,#f7daed)' }} onClick={generateDescription}>{t('generateDescription')}</Button> : null}
            <CancelBtn />
            <OkBtn />
          </div>
        )}
      >
        <Form form={form} key={1} className="mt-4">
          <div className="d-flex justify-content-around">
            <Form.Item<PublishTelegramInterface> name="date" getValueProps={(value) => ({ value: value ? moment(value) : value })} rules={[publishTelegramValidation]}>
              <MomentDatePicker minDate={moment()} placeholder={t('placeholderDate')} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={lang === UserLangEnum.RU ? locale : undefined} />
            </Form.Item>
            <Form.Item<PublishTelegramInterface> name="time">
              <TimePicker
                onChange={(value) => setTime(value)}
                value={time}
                minDate={date}
                placeholder={t('placeholderTime')}
                step={10}
              />
            </Form.Item>
          </div>
          <Form.Item<PublishTelegramInterface> name="description" rules={[publishTelegramValidation]}>
            <Input.TextArea rows={6} placeholder={t('enterDescription')} />
          </Form.Item>
        </Form>
      </Modal>
    ) : (
      <Modal
        title={t('publishSiteTitle')}
        centered
        zIndex={10000}
        classNames={{ header: 'text-center', footer: 'ant-input-group-addon' }}
        open={!!publicationDate}
        onOk={onPublicationDateFinish}
        okText={t('publishUpdate')}
        cancelText={t('cancel')}
        onCancel={handlePublicationDateCancel}
        okButtonProps={{
          disabled: [publicationDateValue, publicationTime].filter(Boolean).length !== 2,
        }}
      >
        <Form form={publicationDateForm} key={2} className="mt-4">
          <div className="d-flex justify-content-around">
            <Form.Item<PublicationDateFormInterface> name="publicationDate" getValueProps={(value) => ({ value: value ? moment(value) : value })} >
              <MomentDatePicker minDate={moment()} placeholder={t('placeholderDate')} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={lang === UserLangEnum.RU ? locale : undefined} />
            </Form.Item>
            <Form.Item<PublicationDateFormInterface> name="publicationTime">
              <TimePicker
                onChange={(value) => setPublicationTime(value)}
                value={publicationTime}
                minDate={publicationDateValue}
                placeholder={t('placeholderTime')}
                step={10}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    );
};

const AdminControlGroup = ({ item, setItem }: AdminControlGroupInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const dispatch = useAppDispatch();

  const { isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const [publicationDate, setPublicationDate] = useState<Date | null>(null);
  const [isTgPublish, setIsTgPublish] = useState(false);
  const [publishData, setPublishData] = useState<PublishTelegramInterface>({
    date: item?.deferredPublication?.date ?? null,
    time: item?.deferredPublication?.date ? moment(item.deferredPublication.date).format(DateFormatEnum.HH_MM) : null,
    description: item.translations.find((translation) => translation.lang === lang)?.description as string,
  });

  const setPublishDataEffect = useEffectEvent(setPublishData);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

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
      toast(tToast('itemDeletedSuccess', { name: item.translations.find((translation) => translation.lang === lang)?.name }), 'success');
    }
    setIsSubmit(false);
  };

  const onEdit = () => router.push({
    pathname: router.pathname,
    query: { ...router.query, edit: true },
  }, undefined, { shallow: true });

  const onPublish = async (values: PublishTelegramInterface) => {
    setIsSubmit(true);
    const [tgH, tgM] = values.time ? values.time.split(':') : [null, null];
    delete values.time;

    if (values.date && tgH && tgM) {
      values.date = moment(values.date).set({ hour: +tgH, minute: +tgM }).toDate();
    }

    if (item.deferredPublication) {
      try {
        const { data } = await axios.put<DeferredPublicationIResponsenterface>(routes.deferredPublication.telegram.updateOne(item.deferredPublication.id), {
          id: item.deferredPublication.id,
          item: { id: item.id },
          ...values,
        });
        if (data.code === 1) {
          setItem({ ...item, deferredPublication: data.deferredPublication });
          setIsTgPublish(false);
          toast(tToast('itemPublishPlannedUpdateSuccess', { name: item.translations.find((translation) => translation.lang === lang)?.name }), 'success');
        }
      } catch (e) {
        axiosErrorHandler(e, tToast, setIsSubmit);
      }
    } else {
      const { payload } = await dispatch(publishItem({ id: item.id, ...values })) as { payload: ItemResponseInterface & { error: string; } };
      if (!payload?.error) {
        setItem(payload.item);
        setIsTgPublish(false);
        toast(tToast(payload.item.deferredPublication && !payload.item.deferredPublication.isPublished ? 'itemPublishPlannedSuccess' : 'itemPublishSuccess', { name: item.translations.find((translation) => translation.lang === lang)?.name }), 'success');
      }
    }
    setIsSubmit(false);
  };

  const onPublicationDateUpdate = async (values: PublicationDateFormInterface) => {
    setIsSubmit(true);
    const [tgH, tgM] = values.publicationTime ? values.publicationTime.split(':') : [null, null];

    if (values.publicationDate && values.publicationTime && tgH && tgM) {
      values.publicationDate = moment(values.publicationDate).set({ hour: +tgH, minute: +tgM }).toDate();

      const { payload } = await dispatch(partialUpdateItem({ id: item.id, data: { publicationDate: values.publicationDate } })) as { payload: ItemResponseInterface; };
      setItem(payload.item);
      setPublicationDate(null);
      toast(tToast('itemPublishPlannedUpdateSuccess', { name: item.translations.find((translation) => translation.lang === lang)?.name }), 'success');
    }
    setIsSubmit(false);
  };

  const onMessageRemove = async () => {
    setIsSubmit(true);
    const { payload } = await dispatch(partialUpdateItem({ id: item.id, data: { message: null } })) as { payload: ItemResponseInterface; };
    setItem(payload.item);
    setIsSubmit(false);
  };

  const onPublicationDateRemove = async () => {
    setIsSubmit(true);
    const { payload } = await dispatch(partialUpdateItem({ id: item.id, data: { publicationDate: null } })) as { payload: ItemResponseInterface; };
    setItem(payload.item);
    setIsSubmit(false);
  };

  const onPublicationRemove = async () => {
    try {
      if (!item.deferredPublication) {
        return;
      }
      setIsSubmit(true);
      const { data } = await axios.delete<DeferredPublicationIResponsenterface>(routes.deferredPublication.telegram.deleteOne(item.deferredPublication.id));
      if (data.code === 1) {
        setItem({ ...item, deferredPublication: null });
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const onDeferredPublicationEdit = () => {
    if (item.deferredPublication) {
      setPublishData({
        date: moment(item.deferredPublication.date).toDate(),
        time: moment(item.deferredPublication.date).format(DateFormatEnum.HH_MM),
        description: item.deferredPublication.description,
      });
      setIsTgPublish(true);
    }
  };

  const onPublicationDateEdit = () => {
    if (item.publicationDate) {
      setPublicationDate(item.publicationDate);
    }
  };

  const generateDescription = async () => {
    try {
      setIsSubmit(true);
      const { data } = await axios.get<{ code: number; description: string; }>(routes.integration.gpt.generateDescription(item.id));
      if (data.code === 1) {
        setPublishData((state) => ({ ...state, description: data.description }));
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  useEffect(() => {
    setPublishDataEffect((state) => ({ ...state, description: item.translations.find((translation) => translation.lang === lang)?.description as string }));
  }, [lang]);

  return isAdmin
    ? isMobile
      ? (
        <>
          <PublishModal publishData={publishData} publicationDate={publicationDate} setPublicationDate={setPublicationDate} isTgPublish={isTgPublish} setIsTgPublish={setIsTgPublish} onPublish={onPublish} onPublicationDateUpdate={onPublicationDateUpdate} generateDescription={generateDescription} lang={lang as UserLangEnum} />
          <FloatButton.Group
            trigger="click"
            style={{ insetInlineEnd: 24, top: '70%', height: 'min-content' }}
            icon={<EllipsisOutlined />}
          >
            <FloatButton onClick={onEdit} icon={<SignatureOutlined />} />
            {item.deleted ? <FloatButton onClick={restoreItemHandler} icon={<UndoOutlined />} /> : <FloatButton onClick={deleteItemHandler} icon={<DeleteOutlined />} />}
            {item.publicationDate
              ? <FloatButton onClick={onPublicationDateEdit} className="float-custom-icon" icon={<RubyOutlined width={40} height={40} />} />
              : null}
            {!item.message?.send && !item.deferredPublication?.date
              ? <FloatButton onClick={() => setIsTgPublish(true)} className="float-custom-icon" icon={<Image src={telegramIcon} width={40} height={40} alt="Telegram" />} />
              : item.deferredPublication && !item.deferredPublication.isPublished
                ? <FloatButton onClick={onDeferredPublicationEdit} className="float-custom-icon" icon={<Telegram width={40} height={40} color="purple" />} />
                : <FloatButton className="float-custom-icon" icon={<Telegram width={40} height={40} color="green" />} />}
          </FloatButton.Group>
        </>
      )
      : (
        <>
          <PublishModal publishData={publishData} publicationDate={publicationDate} setPublicationDate={setPublicationDate} isTgPublish={isTgPublish} setIsTgPublish={setIsTgPublish} onPublish={onPublish} onPublicationDateUpdate={onPublicationDateUpdate} generateDescription={generateDescription} lang={lang as UserLangEnum} />
          <Button type="text" className="action-button edit" onClick={onEdit}>{t('edit')}</Button>
          {item.deleted
            ? <Button type="text" className="action-button restore" onClick={restoreItemHandler}>{t('restore')}</Button>
            : (
              <Popconfirm rootClassName="ant-input-group-addon" title={t('removeTitle')} description={t('removeDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={deleteItemHandler}>
                <Button type="text" className="action-button remove">{t('remove')}</Button>
              </Popconfirm>
            )}
          <div className="position-relative">
            {item.publicationDate
              ? <Tag
                color="cyan"
                variant="outlined"
                className="fs-6 d-flex align-items-center gap-2 position-absolute"
                style={{ top: -40, padding: '5px 10px', color: '#69788e', width: 'min-content' }}
              >
                <RubyOutlined />
                {t('planned', { date: moment(item.publicationDate).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}
                <button
                  className="icon-button text-muted d-flex align-items-center"
                  type="button"
                  onClick={onPublicationDateEdit}
                  title={t('editDeferredPublication')}
                >
                  <EditOutlined />
                </button>
                <Popconfirm rootClassName="ant-input-group-addon" title={t('cancelDeferredPublicationTitle')} description={t('cancelDeferredPublicationDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={onPublicationDateRemove}>
                  <button
                    className="icon-button text-muted d-flex align-items-center"
                    type="button"
                    title={t('cancelDeferredPublicationTitle')}
                  >
                    <CloseOutlined className="fs-6-5" />
                  </button>
                </Popconfirm>
              </Tag>
              : null}
            {!item.message?.send && !item.deferredPublication?.date
              ? <Button type="text" className="action-button send-to-telegram" onClick={() => setIsTgPublish(true)}>{t('publishToTelegram')}</Button>
              : item.deferredPublication && !item.deferredPublication.isPublished
                ? <Tag
                  color="purple"
                  variant="outlined"
                  className="fs-6 d-flex align-items-center gap-2"
                  style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}
                >
                  <Telegram />
                  {t('planned', { date: moment(item.deferredPublication.date).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}
                  <button
                    className="icon-button text-muted d-flex align-items-center"
                    type="button"
                    onClick={onDeferredPublicationEdit}
                    title={t('editDeferredPublication')}
                  >
                    <EditOutlined />
                  </button>
                  <Popconfirm rootClassName="ant-input-group-addon" title={t('cancelDeferredPublicationTitle')} description={t('cancelDeferredPublicationDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={onPublicationRemove}>
                    <button
                      className="icon-button text-muted d-flex align-items-center"
                      type="button"
                      title={t('cancelDeferredPublicationTitle')}
                    >
                      <CloseOutlined className="fs-6-5" />
                    </button>
                  </Popconfirm>
                </Tag>
                : (
                  <Tag
                    color="success"
                    variant="outlined"
                    className="fs-6 d-flex gap-2"
                    style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}
                  >
                    {t('publish', { date: moment(item.message?.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM) })}
                    <Popconfirm rootClassName="ant-input-group-addon" title={t('removeMessageTitle')} description={t('removeMessageDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={onMessageRemove}>
                      <button
                        className="icon-button text-muted d-flex align-items-center"
                        type="button"
                        title={t('removeMessageTitle')}
                      >
                        <CloseOutlined className="fs-6-5" />
                      </button>
                    </Popconfirm>
                  </Tag>
                )}
          </div>
        </>
      ) : null;
};

export const CardItem = ({ item: fetchedItem, paginationParams }: { item: ItemInterface; paginationParams?: PaginationInterface; }) => {
  const { id, collection, images, colors, price, discountPrice, compositions, rating, ...rest } = fetchedItem;

  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tDelivery } = useTranslation('translation', { keyPrefix: 'pages.delivery' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const galleryRef = useRef<ImageGallery>(null);

  const router = useRouter();

  const dispatch = useAppDispatch();

  const { isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const { cart } = useAppSelector((state) => state.cart);
  const { pagination } = useAppSelector((state) => state.app);

  const position = rest.translations.find((translation) => translation.lang === lang) as ItemTranslateEntity;

  const name = position?.name;
  const description = position?.description;
  const length = position?.length;

  const coefficient = 1.3;

  const width = 150;
  const height = width * coefficient;

  const urlParams = useSearchParams();
  const editParams = urlParams.get('edit');

  const grade = rating?.rating ?? 0;

  const { setItem: setContextItem } = useContext(ItemContext);
  const { isMobile } = useContext(MobileContext);

  const [item, setItem] = useState(fetchedItem);
  const [collectionItems, setCollectionItems] = useState<ItemInterface[]>([]);
  const [tab, setTab] = useState<'delivery' | 'warranty'>();
  const [isEdit, setEdit] = useState<boolean | undefined>();
  const [originalHeight, setOriginalHeight] = useState(416);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const setItemEffect = useEffectEvent(setItem);
  const setEditEffect = useEffectEvent(setEdit);

  const inCart = cart.find((cartItem) => cartItem.item.id === item.id);

  const responsive = {
    desktop: {
      breakpoint: { max: 5000, min: 1400 },
      items: 5,
      partialVisibilityGutter: 50,
    },
    middleDesktop: {
      breakpoint: { max: 1400, min: 1200 },
      items: 6,
      partialVisibilityGutter: 5,
    },
    largeTv: {
      breakpoint: { max: 1200, min: 991 },
      items: 5,
      partialVisibilityGutter: 10,
    },
    tv: {
      breakpoint: { max: 991, min: 800 },
      items: 4,
      partialVisibilityGutter: 5,
    },
    largeTablet: {
      breakpoint: { max: 800, min: 767 },
      items: 3,
      partialVisibilityGutter: 50,
    },
    middleTablet: {
      breakpoint: { max: 767, min: 700 },
      items: 3,
      partialVisibilityGutter: 2,
    },
    tablet: {
      breakpoint: { max: 700, min: 520 },
      items: 2,
      partialVisibilityGutter: 75,
    },
    largeMobile: {
      breakpoint: { max: 520, min: 450 },
      items: 2,
      partialVisibilityGutter: 30,
    },
    mobile: {
      breakpoint: { max: 450, min: 0 },
      items: 2,
      partialVisibilityGutter: 3,
    },
  };

  const updateItem = (value: ItemInterface) => {
    setItem(value);
    setContextItem(value);
  };

  const fetchAdditionalItems = useEffectEvent(async () => {
    try {
      const { data } = await axios.get<PaginationEntityInterface<ItemInterface>>(routes.item.getList({ isServer: true }), {
        params: {
          collectionIds: [item.collection?.id],
          excludeIds: [item.id],
        },
      });
      if (data.code === 1) {
        setCollectionItems(data.items);
      }
    } catch (e) {
      axiosErrorHandler(e, tToast);
    }
  });

  useEffect(() => {
    if (isAdmin) {
      setEditEffect(booleanSchema.validateSync(editParams));
    }
  }, [editParams, isAdmin]);

  useEffect(() => {
    if (paginationParams) {
      dispatch(setPaginationParams(paginationParams));
    }
  }, [paginationParams]);

  useEffect(() => {
    if (item.id !== id) {
      setItemEffect(fetchedItem);
    }
  }, [id]);

  useEffect(() => {
    setContextItem(item);

    return () => {
      setContextItem(undefined);
    };
  }, [item.translateName]);

  useEffect(() => {
    if (!isAdmin && item.publicationDate) {
      router.push(routes.page.base.homePage);
    }
  }, [item.publicationDate]);

  useEffect(() => {
    fetchAdditionalItems();
  }, []);

  return isEdit ? <CreateItem oldItem={item} updateItem={updateItem} />: !isAdmin && item.publicationDate ? null : (
    <div className="d-flex flex-column" style={isMobile ? { marginTop: '100px' } : {}}>
      <Helmet title={name} description={description} image={images?.[0]?.src} />
      <div className="d-flex flex-column flex-xl-row justify-content-xl-between justify-content-xxl-start gap-xxl-5 mb-5">
        {isMobile
          ? (
            <div className="d-flex flex-column align-items-md-center">
              <h1 className="mb-4 fs-3">{name}</h1>
              <div className="d-flex mb-4 gap-2">
                {collection
                  ? (
                    <Link href={`${routes.page.base.catalog}?collectionIds=${collection.id}`} style={{ width: 'min-content' }}>
                      <Tag color="#3b6099" variant="filled" className="py-1 px-2 fs-6" style={{ backgroundColor: '#eaeef6' }}>{t('collection', { name: collection.translations.find((translation) => translation.lang === lang)?.name })}</Tag>
                    </Link>
                  )
                  : null}
                {(item.deleted || item.outStock) && (
                  <Tag {...(item.deleted ? { color: 'volcano' } : { style: { backgroundColor: '#74b6d5', color: 'white' } })} variant="filled" className="py-1 px-2 fs-6">
                    {tCart(item.deleted ? 'deleted' : 'isAbsent', { date: moment(item.outStock).format(DateFormatEnum.DD_MM) })}
                  </Tag>
                )}
              </div>
            </div>
          )
          : null}
        <div className="d-flex flex-column align-items-center gap-2">
          <ImageGallery
            ref={galleryRef}
            additionalClass={cn('w-100 mb-2 mb-xl-0 mt-xl-2-5', { 'd-flex align-items-center justify-content-center': isMobile })}
            showIndex
            items={images.sort((a, b) => a.order - b.order).map((image) => ({
              original: image.src,
              renderThumbInner: image.src.endsWith('.mp4') ? () => (
                <video
                  className="w-100"
                  autoPlay
                  loop
                  muted
                  playsInline
                  src={image.src}
                />
              ) : undefined,
              thumbnail: image.src,
              originalHeight: isMobile && originalHeight !== getHeight()
                ? undefined
                : originalHeight,
              originalWidth: isMobile && originalHeight === getHeight()
                ? originalHeight / 1.3
                : undefined,
              renderItem: image.src.endsWith('.mp4')
                ? () => (
                  <video
                    className="image-gallery-image"
                    style={!isFullscreen ? { maxHeight: originalHeight, width: '100%' } : { maxHeight: '100vh' }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    src={image.src}
                  />
                )
                : undefined,
            }))}
            infinite
            showBullets={isMobile}
            showNav={!isMobile}
            onScreenChange={(fullscreen) => {
              if (fullscreen) {
                setIsFullscreen(true);
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
                setIsFullscreen(false);
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
              <div className="d-flex flex-column justify-content-center" style={{ width: '320px', alignSelf: 'end' }}>
                <p style={{ color: '#3b6099' }}>
                  {t('notice')}
                </p>
                <div className="d-flex justify-content-between w-100">
                  <Button type="text" onClick={() => setTab('warranty')} className={cn('text-muted fs-6 fs-xxl-5 py-3-5 py-xxl-4 px-3 px-xxl-3', { disabled: tab === 'delivery' })}>{t('warrantyAndCare')}</Button>
                  <Button type="text" onClick={() => setTab('delivery')} className={cn('text-muted fs-6 fs-xxl-5 py-3-5 py-xxl-4 px-3 px-xxl-3', { disabled: tab === 'warranty' })}>{t('deliveryAndPayment')}</Button>
                </div>
              </div>
            ) : null}
        </div>
        {isMobile
          ? (
            <p style={{ color: '#3b6099' }}>
              {t('notice')}
            </p>
          ) : null}
        <div style={{ width: isMobile ? '100%' : '60%' }}>
          <div className="d-flex flex-column">
            {!isMobile
              ? (
                <>
                  <h1 className="mb-4 mt-xl-0 fs-3">{name}</h1>
                  <div className="d-flex mb-4 gap-2">
                    {collection
                      ? (
                        <Link href={`${routes.page.base.catalog}?collectionIds=${collection.id}`} style={{ width: 'min-content' }}>
                          <Tag color="#3b6099" variant="filled" className="py-1 px-2 fs-6" style={{ backgroundColor: '#eaeef6' }}>{t('collection', { name: collection.translations.find((translation) => translation.lang === lang)?.name })}</Tag>
                        </Link>
                      )
                      : null}
                    {(item.deleted || item.outStock) && (
                      <Tag {...(item.deleted ? { color: 'volcano' } : { style: { backgroundColor: '#74b6d5', color: 'white' } })} variant="filled" className="py-1 px-2 fs-6">
                        {tCart(item.deleted ? 'deleted' : 'isAbsent', { date: moment(item.outStock).format(DateFormatEnum.DD_MM) })}
                      </Tag>
                    )}
                  </div>
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
                  ? (
                    <button
                      className="icon-button text-muted"
                      style={{ color: '#393644' }}
                      type="button"
                      title={t('grades.gradeCount', { count: pagination.count })}
                      onClick={() => scrollToElement('grades', 120)}
                    >
                      {t('grades.gradeCount', { count: pagination.count })}
                    </button>
                  )
                  : <span>{t('grades.gradeCount', { count: pagination.count })}</span>}
              </div>
            </div>
            <div className={cn('d-flex gap-5 mb-4', { 'order-0': isMobile })}>
              <div className="d-flex gap-3">
                {discountPrice ? <p className="fs-5 m-0">{t('price', { price: price - discountPrice })}</p> : null}
                <p className={cn('fs-5 m-0', { 'text-muted text-decoration-line-through fw-light': discountPrice })}>{t('price', { price })}</p>
              </div>
              {isMobile ? <Favorites id={id} /> : null}
              <AdminControlGroup item={item} setItem={updateItem} />
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
                <span className="fs-5">{t('composition')}</span>
                <span>{compositions.map((composition) => composition.translations.find((translation) => translation.lang === lang)?.name).join(', ')}</span>
              </div>
              <div className="d-flex flex-column gap-2">
                <span className="fs-5">{t('color')}</span>
                <div className="d-flex gap-3 flex-wrap">
                  {colors.map((color) => (
                    <div key={color.id} className="d-flex align-items-center gap-2">
                      <span className="d-block" style={{ backgroundColor: color.hex, borderRadius: '50%', width: 25, height: 25 }} />
                      <span>{color.translations.find((translation) => translation.lang === lang)?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="d-flex flex-column gap-2">
                <span className="fs-5">{t('length')}</span>
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
                <b><Link href={routes.page.base.jewelryCarePage} title={t('warranty.12')}>{t('warranty.12')}</Link></b>
                .
              </p>
              <div>
                {t('warranty.13')}
                {' '}
                <Link href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_MAIL}`} target="_blank" className="fw-bold">{process.env.NEXT_PUBLIC_CONTACT_MAIL}</Link>
                {' '}
                {t('warranty.14')}
                {' '}
                <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank" className="fw-bold">@KS_Mary</Link>
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
                <Link href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_MAIL}`} target="_blank" className="fw-bold">{process.env.NEXT_PUBLIC_CONTACT_MAIL}</Link>
                {tDelivery('6')}
                <Link href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? routes.page.base.homePage} target="_blank" className="fw-bold">@KS_Mary</Link>
                {tDelivery('7')}
                <br />
                {tDelivery('8')}
              </div>
              <p key={6} className="my-4">{tDelivery('9')}</p>
              <p key={7} className="mb-4 fs-5 fw-bold">{tDelivery('10')}</p>
              <div key={8}>
                {tDelivery('11')}
                <br />
                {tDelivery('12')}
              </div>
            </div>
          )}
        </div>
      </div>
      <GradeList item={item} setItem={setItem} />
      {collectionItems.length ? (
        <div className="d-flex flex-column align-items-start align-items-xl-end mt-5">
          <h4 className="col-11 mb-5 text-uppercase">{t('otherItem')}</h4>
          <Carousel
            autoPlaySpeed={2000}
            containerClass="col-12 col-xl-11"
            focusOnSelect={true}
            infinite
            arrows={true}
            minimumTouchDrag={80}
            renderArrowsWhenDisabled={false}
            renderButtonGroupOutside={false}
            renderDotsOutside={false}
            partialVisible={true}
            responsive={responsive}
            shouldResetAutoplay
            showDots={false}
            slidesToSlide={1}
            ssr={true}
            swipeable={false}
            draggable={false}
            deviceType={isMobile ? 'mobile' : 'desktop'}
            autoPlay
            pauseOnHover
          >
            {collectionItems.map((collectionItem) => (
              <ImageHover
                key={collectionItem.id}
                href={getHref(collectionItem)}
                height={height}
                width={width}
                images={collectionItem.images}
                name={collectionItem.translations.find((translation) => translation.lang === lang)?.name}
                rating={{ rating: collectionItem.rating, grades: collectionItem.grades }}
                description={t('price', { price: collectionItem.price - collectionItem.discountPrice })}
              />
            ))}
          </Carousel>
        </div>
      ) : null}
    </div>
  );
};
