import ImageGallery, { type ImageGalleryRef } from 'react-image-gallery';
import cn from 'classnames';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { InboxOutlined, UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, DatePicker, Divider, Form, Input, InputNumber, Modal, Select, Switch, Upload, type UploadFile, type UploadProps } from 'antd';
import { cloneDeep, isEmpty, isEqual, isNil, omit, some } from 'lodash';
import moment, { type Moment } from 'moment';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { routes } from '@/routes';
import { newItemValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { addItem, deleteItemImage, updateItem, type ItemWithUrlResponseInterface } from '@/slices/appSlice';
import { SortableItem } from '@/components/SortableItem';
import { NotFoundContent } from '@/components/NotFoundContent';
import { CropImage } from '@/components/CropImage';
import { TimePicker } from '@/components/TimePicker';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { getHeight } from '@/utilities/screenExtension';
import { sortItemImagesByOrder } from '@/utilities/sortItemImagesByOrder';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { ImageEntity } from '@server/db/entities/image.entity';
import { locale } from '@/locales/pickers.locale.ru';
import type { CompositionEntity } from '@server/db/entities/composition.entity';
import type { ResponseFileInterface } from '@/types/storage/ResponseFileInterface';
import type { ItemCollectionInterface, ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { CompositionInterface } from '@/types/composition/CompositionInterface';
import type { ColorInterface } from '@/types/color/ColorInterface';
import type { ColorEntity } from '@server/db/entities/color.entity';
import type { ItemTranslateEntity } from '@server/db/entities/item.translate.entity';

import styles from './V2AdminCreateItem.module.scss';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

interface ItemFormInterface extends Omit<Partial<ItemInterface>, 'translations' | 'group' | 'collection' | 'compositions' | 'colors'> {
  translations: Record<UserLangEnum, { name?: string; description?: string; length?: string; }>;
  group?: number | ItemInterface['group'];
  collection?: number | ItemInterface['collection'];
  compositions?: (number | CompositionEntity)[];
  colors?: (number | ColorEntity)[];
  telegramPublicationTime?: string | Date | null;
  itemPublicationTime?: string | Date | null;
}

export const getServerSideProps = async () => {
  const { data: { itemCollections } } = await axios.get<{ itemCollections: ItemCollectionInterface[]; }>(routes.itemCollection.findMany({ isServer: false }));
  return { props: { itemCollections } };
};

export const V2AdminCreateItem = ({ itemCollections: fetchedItemCollections, oldItem, updateItem: updateStateItem }: { oldItem?: ItemInterface; itemCollections?: ItemCollectionInterface[]; updateItem?: (value: ItemInterface) => void; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.createItem' });
  const { t: tCardItem } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { isAdmin, token, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const { itemGroups, axiosAuth } = useAppSelector((state) => state.app);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [itemCollections, setItemCollections] = useState<ItemCollectionInterface[]>((fetchedItemCollections || []));

  const uploadProps: UploadProps<ResponseFileInterface> = {
    name: 'file',
    fileList,
    accept: 'image/png,image/jpg,image/jpeg,video/mp4',
    action: routes.storage.image.upload({ isServer: false }),
    headers: { Authorization: `Bearer ${token}` },
    onChange(info) {
      setFileList(info.fileList);
      const { status, response } = info.file;
      if (status === 'done' && response) {
        toast(t('success', { fileName: info.file.name }), 'success');
        setImages((state) => [...state, response.image]);
      } else if (status === 'error') {
        toast(response?.message ?? '', 'error');
      }
    },
    onRemove(file) {
      setImages((state) => state.filter((image) => image.id !== file.response?.image.id));
      if (file.response?.image.id) {
        dispatch(deleteItemImage(file.response.image.id));
      }
    },
  };

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const galleryRef = useRef<ImageGalleryRef>(null);

  const [item, setItem] = useState<Partial<ItemInterface> | undefined>(oldItem);
  const [images, setImages] = useState<ItemInterface['images']>(() => sortItemImagesByOrder(oldItem?.images));
  const [itemGroup, setItemGroup] = useState<ItemGroupInterface | undefined | null>(item?.group);
  const [itemCollection, setItemCollection] = useState<ItemCollectionInterface | undefined | null>(item?.collection);
  const [itemCompositions, setItemCompositions] = useState<CompositionInterface[] | undefined>(item?.compositions);
  const [compositions, setCompositions] = useState<CompositionInterface[]>([]);
  const [itemColors, setItemColors] = useState<ColorInterface[] | undefined>(item?.colors);
  const [colors, setColors] = useState<ColorInterface[]>([]);
  const [isSortImage, setIsSortImage] = useState(false);
  const [lastProgress, setLastProgress] = useState('');
  const [isFinish, setIsFinish] = useState(false);
  const [itemPublicationTime, setItemPublicationTime] = useState<string | null>(null);
  const [telegramPublicationTime, setTelegramPublicationTime] = useState<string | null>(null);

  const [originalHeight, setOriginalHeight] = useState(416);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(isMobile ? isMobile : true);

  const imageGalleryItems = useMemo(
    () =>
      images.map((image) => ({
        original: image.src,
        renderThumbInner: image.src.endsWith('.mp4') ? () => (
          <video className="w-100" autoPlay loop muted playsInline src={image.src} />
        ) : undefined,
        thumbnail: image.src,
        originalHeight: isMobile && originalHeight !== getHeight() ? undefined : String(originalHeight),
        originalWidth: isMobile && originalHeight === getHeight() ? String(originalHeight / 1.3) : undefined,
        renderItem: image.src.endsWith('.mp4')
          ? () => (
            <video style={{ maxHeight: originalHeight, width: '100%' }} autoPlay loop muted playsInline src={image.src} />
          )
          : undefined,
      })),
    [images, isMobile, originalHeight],
  );
  const [form] = Form.useForm<ItemFormInterface>();
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const handleModalOk = () => {
    const savedProgress = window.localStorage.getItem(process.env.NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY ?? '');
    if (savedProgress) {
      const parsedSavedProgress = JSON.parse(savedProgress) as { data: ItemFormInterface; images: ImageEntity[]; lastProgress: Date; };
      form.setFieldsValue(parsedSavedProgress.data);
      setImages(sortItemImagesByOrder(parsedSavedProgress.images));
      setItemGroup(itemGroups.find(({ id }) => id === parsedSavedProgress.data.group));
      setItemCollection(itemCollections.find((collection) => collection?.id === parsedSavedProgress.data.collection));
      setItemCompositions(compositions?.filter(({ id }) => id === parsedSavedProgress.data.compositions?.find((composition) => composition === id)));
      setItemColors(colors?.filter(({ id }) => id === parsedSavedProgress.data.colors?.find((color) => color === id)));
    }
    setLastProgress('');
  };

  const handleModalCancel = () => {
    window.localStorage.removeItem(process.env.NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY ?? '');
    setLastProgress('');
  };

  const sortImageHandler = () => setIsSortImage(!isSortImage);

  const [activeId, setActiveId] = useState(0);

  const initialValues: ItemFormInterface = {
    ...item,
    group: itemGroup?.id,
    collection: itemCollection?.id,
    compositions: itemCompositions?.map((composition) => composition.id),
    colors: itemColors?.map((color) => color.id),
    translations: {
      [UserLangEnum.RU]: {
        name: item?.translations?.find((translation) => translation.lang === UserLangEnum.RU)?.name,
        description: item?.translations?.find((translation) => translation.lang === UserLangEnum.RU)?.description,
        length: item?.translations?.find((translation) => translation.lang === UserLangEnum.RU)?.length,
      },
      [UserLangEnum.EN]: {
        name: item?.translations?.find((translation) => translation.lang === UserLangEnum.EN)?.name,
        description: item?.translations?.find((translation) => translation.lang === UserLangEnum.EN)?.description,
        length: item?.translations?.find((translation) => translation.lang === UserLangEnum.EN)?.length,
      },
    },
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((image) => image.id === active.id);
        const newIndex = items.findIndex((image) => image.id === over.id);
        if (oldIndex < 0 || newIndex < 0) {
          return items;
        }
        const moved = arrayMove(items, oldIndex, newIndex);
        moved.forEach((image, index) => {
          image.order = index;
        });
        return moved;
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(+active.id);
  };

  const onFinish = async (values: ItemInterface | ItemFormInterface) => {
    setIsSubmit(true);
    values.images = images;
    values.group = itemGroup as ItemGroupInterface;
    values.collection = itemCollection as ItemCollectionInterface;
    values.compositions = (itemCompositions ?? []).map((composition) => ({ id: typeof composition === 'number' ? composition : composition.id } as CompositionEntity));
    values.colors = (itemColors ?? []).map((color) => ({ id: typeof color === 'number' ? color : color.id } as ColorEntity));
    values.translations = Object.entries(values.translations).map(([language, { name, description, length }]) => ({ name, description, length, lang: language } as ItemTranslateEntity));

    let code: number;
    if (oldItem) {
      const cloneItem = cloneDeep(item);
      const cloneOldItem = cloneDeep(oldItem);
      cloneOldItem.translations = cloneOldItem.translations.map(({ name, description, length, lang: language }) => ({ name, description, length, lang: language } as ItemTranslateEntity));
      if (cloneItem?.compositions?.length) {
        cloneItem.compositions = cloneItem.compositions.map((composition) => ({ id: composition.id } as CompositionEntity));
        cloneOldItem.compositions = cloneOldItem.compositions.map((composition) => ({ id: composition.id } as CompositionEntity));
      }
      if (cloneItem?.colors?.length) {
        cloneItem.colors = cloneItem.colors.map((color) => ({ id: color.id } as ColorEntity));
        cloneOldItem.colors = cloneOldItem.colors.map((color) => ({ id: color.id } as ColorEntity));
      }
      if (isEqual(cloneOldItem, { ...cloneItem, ...values })) {
        setIsSubmit(false);
        return;
      }
      const { payload } = await dispatch(updateItem({ id: oldItem.id, data: { ...oldItem, ...values } as ItemInterface })) as { payload: ItemWithUrlResponseInterface; };
      code = payload.code;
      if (code === 1 && updateStateItem) {
        updateStateItem(payload.item);
        toast(tToast('itemUpdatedSuccess', { name: oldItem.translations.find((translation) => translation.lang === lang)?.name }), 'success');
        router.push(payload.url);
      }
    } else {
      const [itemHour, itemMinute] = itemPublicationTime ? itemPublicationTime.split(':') : [null, null];
      const [tgHour, tgMinute] = telegramPublicationTime ? telegramPublicationTime.split(':') : [null, null];

      if (values.publicationDate && itemHour && itemMinute) {
        values.publicationDate = moment(values.publicationDate).set({ hour: +itemHour, minute: +itemMinute }).toDate();
      } else {
        delete values.publicationDate;
      }
      if (values.deferredPublication?.date && tgHour && tgMinute) {
        values.deferredPublication = {
          date: moment(values.deferredPublication?.date).set({ hour: +tgHour, minute: +tgMinute }).toDate(),
          description: values.deferredPublication?.description,
        } as ItemInterface['deferredPublication'];
      } else {
        delete values.deferredPublication;
      }

      const { payload } = await dispatch(addItem(values as ItemInterface)) as { payload: ItemWithUrlResponseInterface; };
      code = payload.code;
      if (code === 1) {
        setItem(undefined);
        setItemGroup(undefined);
        setItemCollection(undefined);
        setItemCompositions(undefined);
        setItemColors(undefined);
        setItemPublicationTime(null);
        setTelegramPublicationTime(null);
        setFileList([]);
        setImages([]);
        form.resetFields();
        form.setFieldValue('group', undefined);
        form.setFieldValue('collection', undefined);
        form.setFieldValue('compositions', undefined);
        form.setFieldValue('colors', undefined);
        window.localStorage.removeItem(process.env.NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY ?? '');
        setIsFinish(false);
        if (values.publicationDate) {
          toast(tToast('itemPublishPlannedSuccess', { name: values.translations.find((translation) => translation.lang === lang)?.name }), 'success');
        } else {
          window.open(payload.url, '_blank');
        }
      }
    }

    if (code === 2) {
      const name = values.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name;
      form.setFields([{ name: ['translations', UserLangEnum.RU, 'name'], errors: [tToast('itemExist', { name })] }]);
      toast(tToast('itemExist', { name }), 'error');
    }
    setIsSubmit(false);
  };

  const generateDescription = async (isSubmitTelegramModal = false) => {
    try {
      setIsSubmit(true);
      const values = form.getFieldsValue();

      if (!values.compositions?.length || !images.length) {
        form.setFields([{ name: (isSubmitTelegramModal ? ['deferredPublication', 'description'] : ['translations', lang as UserLangEnum, 'description']) as Parameters<typeof form.setFieldValue>[0], errors: [tToast('requiredFields')] }]);
        throw new Error(tToast('requiredFields'));
      }

      values.images = images;
      values.compositions = compositions.filter((composition) => itemCompositions?.find((value) => typeof value === 'number' ? value === composition.id : value.id === composition.id)) as CompositionEntity[];

      const { data } = await axios.post<{ code: number; description: string; }>(routes.integration.gpt.generateDescriptionWithoutItem, values);

      if (data.code === 1) {
        if (!isSubmitTelegramModal) {
          const descriptionFieldName = ['translations', lang as UserLangEnum, 'description'] as Parameters<typeof form.setFieldValue>[0];
          form.setFields([{ name: descriptionFieldName, errors: [] }]);
          form.setFieldValue(descriptionFieldName, data.description);
        } else {
          form.setFieldValue(['deferredPublication', 'description'] as Parameters<typeof form.setFieldValue>[0], data.description);
        }
      }
      setIsSubmit(false);
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    }
  };

  const onSubmit = () => {
    form.validateFields().then(() => setIsFinish(true));
  };

  const itemPublicationDate = Form.useWatch('publicationDate', form);
  const telegramPublicationDate = Form.useWatch(['deferredPublication', 'date'], form);

  const saveProgress = useCallback(() => {
    const formValues = form.getFieldsValue();
    const rootValues = some(omit(formValues, 'translations'), (value) => typeof value === 'object' ? !isEmpty(value) : !!value);
    const nestedValues = some(formValues.translations, (langObject) => some(langObject, (value) => !isEmpty(value)));
    if (rootValues || nestedValues || imagesRef.current.length) {
      window.localStorage.setItem(process.env.NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY ?? '', JSON.stringify({ data: formValues, images: imagesRef.current, lastProgress: moment() }));
    }
  }, [imagesRef.current.length, form]);

  const getSubmitButtonText = useCallback(() => {
    let text = 'publishNow';
    if (itemPublicationDate && itemPublicationTime && telegramPublicationDate && telegramPublicationTime) {
      text = 'fullPlanOkText';
    } else if (itemPublicationDate && itemPublicationTime) {
      text = 'sitePlanOkText';
    } else if (telegramPublicationDate && telegramPublicationTime) {
      text = 'tgPlanOkText';
    }
    return t(`modalSubmit.${text}`);
  }, [itemPublicationDate, itemPublicationTime, telegramPublicationDate, telegramPublicationTime]);

  useEffect(() => {
    if (axiosAuth) {
      Promise.all([
        axios.get(routes.composition.findMany),
        axios.get(routes.color.findMany),
      ])
        .then(([{ data: compositionsResponse }, { data: colorsResponse }]) => {
          if (compositionsResponse.code === 1) setCompositions(compositionsResponse.compositions);
          if (colorsResponse.code === 1) setColors(colorsResponse.colors);
        })
        .catch((error) => axiosErrorHandler(error, tToast));
    }
  }, [axiosAuth]);

  useEffect(() => {
    if (!fetchedItemCollections) {
      axios.get<{ itemCollections: ItemCollectionInterface[]; }>(routes.itemCollection.findMany({ isServer: false }))
        .then(({ data }) => setItemCollections(data.itemCollections))
        .catch((error) => axiosErrorHandler(error, tToast));
    }
  }, [fetchedItemCollections]);

  useEffect(() => {
    if (isSortImage) {
      document.body.style.overflowY = 'hidden';
    } else {
      document.body.style.overflowY = '';
    }
  }, [isSortImage]);

  useEffect(() => {
    if (!isNil(oldItem) && !isNil(oldItem.id)) {
      setImages(sortItemImagesByOrder(oldItem.images));
    }
  }, [oldItem?.id]);

  useEffect(() => {
    if (!oldItem) {
      const savedProgress = window.localStorage.getItem(process.env.NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY ?? '');
      if (savedProgress) {
        const parsedSavedProgress = JSON.parse(savedProgress) as { data: ItemFormInterface; lastProgress: Date; };
        const rootValues = some(omit(parsedSavedProgress.data, 'translations'), (value) => typeof value === 'object' ? !isEmpty(value) : !!value);
        const nestedValues = some(parsedSavedProgress.data.translations, (langObject) => some(langObject, (value) => !isEmpty(value)));
        if (rootValues || nestedValues || imagesRef.current.length) {
          setLastProgress(moment(parsedSavedProgress.lastProgress).format(DateFormatEnum.DD_MM_YYYY_HH_MM));
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!oldItem) {
      const interval = setInterval(saveProgress, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  if (!isAdmin) return null;

  return (
    <>
      <Helmet title={t(oldItem ? 'editTitle' : 'title')} description={t(oldItem ? 'editDescription' : 'description')} />

      {lastProgress && (
        <Modal
          title={t('modal.title')}
          closable={{ 'aria-label': t('modal.cancelText') }}
          classNames={{ footer: 'ant-input-group-addon' }}
          centered
          open
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText={t('modal.okText')}
          cancelText={t('modal.cancelText')}
        >
          <p>{t('modal.body1', { date: lastProgress })}</p>
          <p>{t('modal.body2')}</p>
        </Modal>
      )}

      <div className={styles.page}>
        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          {oldItem && (
            <button className={styles.backButton} onClick={() => router.back()} type="button">
              <ArrowLeftOutlined />
              <span>{t('back')}</span>
            </button>
          )}
          <h1 className={styles.pageTitle}>{t(oldItem ? 'editTitle' : 'title')}</h1>
        </div>

        {/* ── Main layout ── */}
        <div className={styles.layout}>
          {/* ── Media panel ── */}
          <div className={styles.mediaPanel}>
            {isMobile && (
              <div className={styles.sortToggle}>
                <Switch
                  checkedChildren={t('onSortImage')}
                  unCheckedChildren={t('unSortImage')}
                  checked={isSortImage}
                  onChange={sortImageHandler}
                />
              </div>
            )}

            {images.length > 0 && (
              isSortImage ? (
                <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} modifiers={[restrictToWindowEdges]}>
                  <SortableContext items={images.map(({ id }) => id)} strategy={rectSortingStrategy}>
                    <div className={styles.sortGrid}>
                      {images.map((image, index) => (
                        <SortableItem
                          key={image.id}
                          image={image}
                          index={index + 1}
                          activeId={activeId}
                          setImages={setImages}
                          setFileList={setFileList}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <ImageGallery
                  ref={galleryRef}
                  additionalClass={styles.gallery}
                  showIndex
                  items={imageGalleryItems}
                  infinite
                  showBullets={isMobile}
                  showNav={!isMobile}
                  onScreenChange={(fullscreen) => {
                    if (fullscreen) {
                      setOriginalHeight(getHeight());
                      document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 110px)');
                      document.documentElement.style.setProperty('--galleryHeight', '100vh');
                      if (isMobile) {
                        const galleryDiv = document.querySelector('.image-gallery-slide-wrapper.image-gallery-thumbnails-right') as HTMLElement;
                        if (galleryDiv) {
                          galleryDiv.style.transition = '0.25s all';
                          galleryDiv.style.width = 'calc(100% - 30px)';
                        }
                        document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 30px)');
                        setShowThumbnails(false);
                      }
                    } else {
                      setOriginalHeight(416);
                      document.documentElement.style.setProperty('--galleryWidth', '320px');
                      document.documentElement.style.setProperty('--galleryHeight', '416px');
                      if (isMobile) {
                        const galleryDiv = document.querySelector('.image-gallery-slide-wrapper.image-gallery-thumbnails-right') as HTMLElement;
                        if (galleryDiv) {
                          galleryDiv.style.width = '';
                          galleryDiv.style.transition = '';
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
              )
            )}

            <CropImage>
              {isMobile ? (
                <Upload className={styles.uploadMobile} {...uploadProps}>
                  <Button className={styles.uploadMobileButton} icon={<UploadOutlined />}>
                    {t('uploadMobileText')}
                  </Button>
                </Upload>
              ) : (
                <Upload.Dragger className={styles.dragger} {...uploadProps}>
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">{t('uploadText')}</p>
                  <p className="ant-upload-hint">{t('uploadHint')}</p>
                </Upload.Dragger>
              )}
            </CropImage>
          </div>

          {/* ── Form panel ── */}
          <div className={styles.formPanel}>
            <Form
              name="create-item"
              scrollToFirstError
              initialValues={initialValues}
              onFinish={onFinish}
              form={form}
              className={styles.form}
            >
              {/* ── Publication modal ── */}
              <Modal
                centered
                classNames={{ footer: 'ant-input-group-addon d-flex justify-content-center' }}
                open={isFinish}
                zIndex={10000}
                onOk={form.submit}
                okText={getSubmitButtonText()}
                cancelText={t('modalSubmit.cancelText')}
                onCancel={() => setIsFinish(false)}
                footer={(_, { OkBtn, CancelBtn }) => (
                  <div className={styles.modalFooter}>
                    <CancelBtn />
                    <OkBtn />
                  </div>
                )}
              >
                <div className={styles.modalBody}>
                  <Divider className="font-oswald fs-5 mb-4">{t('modalSubmit.siteTitle')}</Divider>
                  <div className={styles.modalDateRow}>
                    <Form.Item<ItemFormInterface> name="publicationDate" rules={[newItemValidation]} getValueProps={(value) => ({ value: value ? moment(value) : value })}>
                      <MomentDatePicker minDate={moment()} placeholder={t('modalSubmit.placeholderDate')} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={lang === UserLangEnum.RU ? locale : undefined} />
                    </Form.Item>
                    <Form.Item<ItemFormInterface>>
                      <TimePicker onChange={(value) => setItemPublicationTime(value)} value={itemPublicationTime} minDate={itemPublicationDate} placeholder={t('modalSubmit.placeholderTime')} step={10} />
                    </Form.Item>
                  </div>
                  <Divider className="font-oswald fs-5 mb-4">{t('modalSubmit.tgTitle')}</Divider>
                  <div className={styles.modalTgSection}>
                    <div className={styles.modalDateRow}>
                      <Form.Item<ItemFormInterface> name={['deferredPublication', 'date']} rules={[newItemValidation]} getValueProps={(value) => ({ value: value ? moment(value) : value })}>
                        <MomentDatePicker minDate={moment()} placeholder={t('modalSubmit.placeholderDate')} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={lang === UserLangEnum.RU ? locale : undefined} />
                      </Form.Item>
                      <Form.Item<ItemFormInterface>>
                        <TimePicker onChange={(value) => setTelegramPublicationTime(value)} value={telegramPublicationTime} minDate={telegramPublicationDate} placeholder={t('modalSubmit.placeholderTime')} step={10} />
                      </Form.Item>
                    </div>
                    <Form.Item<ItemFormInterface> name={['deferredPublication', 'description']} rules={[newItemValidation]}>
                      <Input.TextArea rows={6} placeholder={t('modalSubmit.enterDescription')} />
                    </Form.Item>
                    <div className={styles.generateButtonRow}>
                      <Button style={{ background: 'linear-gradient(135deg,#fdd8a6,#f7daed)' }} onClick={() => generateDescription(true)}>
                        {t('generateDescription')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Modal>

              {/* ── Section: Names ── */}
              <div className={styles.section}>
                <div className={styles.namesGrid}>
                  <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.RU, 'name']} className={styles.formItem} rules={[newItemValidation]}>
                    <Input variant="borderless" size="large" placeholder={t('placeholders.name')} className={styles.nameInput} />
                  </Form.Item>
                  <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.EN, 'name']} className={styles.formItem} rules={[newItemValidation]}>
                    <Input variant="borderless" size="large" placeholder={t('placeholders.nameEn')} className={cn(styles.nameInput, styles.nameInputEn)} />
                  </Form.Item>
                </div>
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Section: Filters ── */}
              <div className={styles.section}>
                <div className={styles.filtersRow}>
                  <Form.Item<ItemFormInterface> name="group" className={styles.formItem} rules={[newItemValidation]}>
                    <Select
                      showSearch={{ optionFilterProp: 'label', filterSort: (a, b) => (a?.label ?? '').toLowerCase().localeCompare((b?.label ?? '').toLowerCase()) }}
                      allowClear
                      notFoundContent={<NotFoundContent />}
                      size="large"
                      placeholder={t('placeholders.group')}
                      variant="borderless"
                      className={styles.select}
                      onSelect={(groupId: number) => {
                        const group = itemGroups.find(({ id }) => id === groupId);
                        setItemGroup(group);
                        setItem((state) => ({ ...state, group }));
                      }}
                      onClear={() => setItemGroup(null)}
                      options={itemGroups.map(({ id, translations }) => ({ value: id, label: translations.find((translation) => translation.lang === lang)?.name }))}
                    />
                  </Form.Item>
                  <Form.Item<ItemFormInterface> name="collection" className={styles.formItem}>
                    <Select
                      showSearch={{ optionFilterProp: 'label', filterSort: (a, b) => (a?.label ?? '').toLowerCase().localeCompare((b?.label ?? '').toLowerCase()) }}
                      allowClear
                      notFoundContent={<NotFoundContent />}
                      size="large"
                      placeholder={t('placeholders.collection')}
                      variant="borderless"
                      className={styles.select}
                      onSelect={(collectionId: number) => {
                        const collection = itemCollections.find((value) => value?.id === collectionId);
                        setItemCollection(collection);
                        setItem((state) => ({ ...state, collection }));
                      }}
                      onClear={() => setItemCollection(null)}
                      options={itemCollections.map((value) => ({ value: value?.id, label: value?.translations.find((translation) => translation.lang === lang)?.name }))}
                    />
                  </Form.Item>
                  <div className={styles.badges}>
                    <Form.Item<ItemFormInterface> name="new" valuePropName="checked" className={styles.formItemInline}>
                      <Checkbox className={styles.badge}>{t('new')}</Checkbox>
                    </Form.Item>
                    <Form.Item<ItemFormInterface> name="bestseller" valuePropName="checked" className={styles.formItemInline}>
                      <Checkbox className={styles.badge}>{t('bestseller')}</Checkbox>
                    </Form.Item>
                  </div>
                </div>
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Section: Pricing ── */}
              <div className={styles.section}>
                <div className={styles.pricingRow}>
                  <Form.Item<ItemFormInterface> name="price" rules={[newItemValidation]} className={styles.formItem}>
                    <InputNumber size="large" variant="borderless" placeholder={t('placeholders.price')} prefix="₽" className={styles.priceInput} />
                  </Form.Item>
                  <Form.Item<ItemFormInterface> name="discountPrice" rules={[newItemValidation]} className={styles.formItem}>
                    <InputNumber size="large" variant="borderless" placeholder={t('placeholders.discountPrice')} prefix="₽" className={styles.priceInput} />
                  </Form.Item>
                  <Form.Item<ItemFormInterface> className={styles.formItem} name="outStock" rules={[newItemValidation]} getValueProps={(value) => ({ value: value ? moment(value) : value })}>
                    <MomentDatePicker
                      className={styles.datePicker}
                      size="large"
                      variant="borderless"
                      minDate={moment().add(1, 'day')}
                      placeholder={t('isAbsent')}
                      allowClear
                      showNow={false}
                      format={DateFormatEnum.DD_MM_YYYY}
                      locale={lang === UserLangEnum.RU ? locale : undefined}
                    />
                  </Form.Item>
                </div>
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Section: Actions ── */}
              <div className={styles.actionsSection}>
                <button
                  className={styles.submitButton}
                  type="button"
                  onClick={oldItem ? form.submit : onSubmit}
                >
                  {t(oldItem ? 'submitEditButton' : 'submitButton')}
                </button>
                {!isMobile && (
                  <Switch
                    checkedChildren={t('onSortImage')}
                    unCheckedChildren={t('unSortImage')}
                    checked={isSortImage}
                    onChange={sortImageHandler}
                  />
                )}
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Section: Descriptions ── */}
              <div className={styles.section}>
                <div className={styles.descriptionGroup}>
                  <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.RU, 'description']} className={styles.formItem} rules={[newItemValidation]}>
                    <Input.TextArea variant="borderless" size="large" rows={3} placeholder={t('placeholders.description')} className={styles.textarea} />
                  </Form.Item>
                  <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.EN, 'description']} className={styles.formItem} rules={[newItemValidation]}>
                    <Input.TextArea variant="borderless" size="large" rows={3} placeholder={t('placeholders.descriptionEn')} className={cn(styles.textarea, styles.textareaEn)} />
                  </Form.Item>
                  <div className={styles.generateRow}>
                    <button
                      type="button"
                      className={styles.generateButton}
                      onClick={() => generateDescription()}
                    >
                      {t('generateDescription')}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.sectionDivider} />

              {/* ── Section: Attributes ── */}
              <div className={styles.section}>
                <div className={styles.attributesGrid}>
                  <div className={styles.attributeField}>
                    <span className={styles.attributeLabel}>{tCardItem('composition')}</span>
                    <Form.Item<ItemFormInterface> name="compositions" rules={[newItemValidation]} className={styles.formItem}>
                      <Select
                        mode="multiple"
                        allowClear
                        size="large"
                        notFoundContent={<NotFoundContent />}
                        placeholder={t('placeholders.composition')}
                        variant="borderless"
                        className={styles.selectMulti}
                        showSearch={{ optionFilterProp: 'label', filterSort: (a, b) => (a?.label ?? '').toLowerCase().localeCompare((b?.label ?? '').toLowerCase()) }}
                        onChange={(state) => setItemCompositions(state)}
                        onClear={() => setItemCompositions([])}
                        options={compositions?.map(({ id, translations }) => ({ value: id, label: translations.find((translation) => translation.lang === lang)?.name }))}
                      />
                    </Form.Item>
                  </div>

                  <div className={styles.attributeField}>
                    <span className={styles.attributeLabel}>{tCardItem('color')}</span>
                    <Form.Item<ItemFormInterface> name="colors" rules={[newItemValidation]} className={styles.formItem}>
                      <Select
                        mode="multiple"
                        allowClear
                        size="large"
                        notFoundContent={<NotFoundContent />}
                        placeholder={t('placeholders.color')}
                        variant="borderless"
                        className={styles.selectMulti}
                        showSearch={{
                          optionFilterProp: 'label',
                          filterOption: (input, option) => option?.label.props.children[1]?.props?.children?.toLowerCase().includes(input.toLowerCase()),
                        }}
                        onChange={(state) => setItemColors(state)}
                        onClear={() => setItemColors([])}
                        options={colors?.map(({ id, translations, hex }) => ({
                          value: id,
                          label: (
                            <div className={styles.colorOption}>
                              <span className={styles.colorDot} style={{ backgroundColor: hex }} />
                              <span>{translations.find((translation) => translation.lang === lang)?.name}</span>
                            </div>
                          ),
                        }))}
                      />
                    </Form.Item>
                  </div>

                  <div className={styles.attributeField}>
                    <span className={styles.attributeLabel}>{tCardItem('length')}</span>
                    <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.RU, 'length']} rules={[newItemValidation]} className={styles.formItem}>
                      <Input variant="borderless" size="large" placeholder={t('placeholders.length')} className={styles.attributeInput} />
                    </Form.Item>
                  </div>

                  <div className={styles.attributeField}>
                    <span className={styles.attributeLabel}>{tCardItem('lengthEn')}</span>
                    <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.EN, 'length']} rules={[newItemValidation]} className={styles.formItem}>
                      <Input variant="borderless" size="large" placeholder={t('placeholders.lengthEn')} className={styles.attributeInput} />
                    </Form.Item>
                  </div>
                </div>
              </div>

              {/* ── Mobile submit ── */}
              {isMobile && (
                <div className={styles.mobileSubmit}>
                  <button className={styles.submitButton} type="button" onClick={oldItem ? form.submit : onSubmit}>
                    {t(oldItem ? 'submitEditButton' : 'submitButton')}
                  </button>
                </div>
              )}
            </Form>
          </div>
        </div>
      </div>
    </>
  );
};

