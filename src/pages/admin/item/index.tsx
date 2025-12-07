import ImageGallery from 'react-image-gallery';
import cn from 'classnames';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { RightOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Breadcrumb, Button, Form, Input, InputNumber, Select, Upload, Modal, type UploadProps, type UploadFile, Switch, Checkbox, DatePicker, Divider } from 'antd';
import { isEqual, some, isEmpty, omit, cloneDeep } from 'lodash';
import moment, { type Moment } from 'moment';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { routes } from '@/routes';
import { newItemValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { addItem, updateItem, deleteItemImage, type ItemWithUrlResponseInterface } from '@/slices/appSlice';
import { SortableItem } from '@/components/SortableItem';
import { NotFoundContent } from '@/components/NotFoundContent';
import { BackButton } from '@/components/BackButton';
import { CropImage } from '@/components/CropImage';
import { TimePicker } from '@/components/TimePicker';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { getHeight } from '@/utilities/screenExtension';
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

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

interface ItemFormInterface extends Omit<Partial<ItemInterface>, 'translations' | 'group' | 'collection' | 'compositions' | 'colors'> {
  translations: Record<UserLangEnum, { name?: string; description?: string; length?: string; }>,
  group?: number | ItemInterface['group'];
  collection?: number | ItemInterface['collection'];
  compositions?: (number | CompositionEntity)[];
  colors?: (number | ColorEntity)[];
  telegramPublicationTime?: string | Date | null;
  itemPublicationTime?: string | Date | null;
}

export const getServerSideProps = async () => {
  const { data: { itemCollections } } = await axios.get<{ itemCollections: ItemCollectionInterface[]; }>(routes.itemCollection.findMany({ isServer: false }));

  return {
    props: {
      itemCollections,
    },
  };
};

const CreateItem = ({ itemCollections: fetchedItemCollections, oldItem, updateItem: updateStateItem }: { oldItem?: ItemInterface; itemCollections?: ItemCollectionInterface[]; updateItem?: (value: ItemInterface) => void; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.createItem' });
  const { t: tCardItem } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { isAdmin, token, lang } = useAppSelector((state) => state.user);
  const { itemGroups, axiosAuth } = useAppSelector((state) => state.app);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [itemCollections, setItemCollections] = useState<ItemCollectionInterface[]>((fetchedItemCollections || []));

  const props: UploadProps<ResponseFileInterface> = {
    name: 'file',
    fileList,
    accept: 'image/png,image/jpg,image/jpeg,video/mp4',
    action: routes.storage.image.upload({ isServer: false }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

  const [breadcrumbs, setBreadcrumbs] = useState([{ title: t('home') }, { title: t('catalog') }]);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const galleryRef = useRef<ImageGallery>(null);

  const [item, setItem] = useState<Partial<ItemInterface> | undefined>(oldItem);
  const [images, setImages] = useState<ItemInterface['images']>(oldItem?.images || []);
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

  const [form] = Form.useForm<ItemFormInterface>();

  const itemName: string = Form.useWatch(['translations', lang, 'name'], form);

  const imagesRef = useRef(images);
  imagesRef.current = images;

  const handleModalOk = () => {
    const savedProgress = window.localStorage.getItem(process.env.NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY ?? '');
    if (savedProgress) {
      const parsedSavedProgress = JSON.parse(savedProgress) as { data: ItemFormInterface; images: ImageEntity[]; lastProgress: Date; };
      form.setFieldsValue(parsedSavedProgress.data);
      setImages(parsedSavedProgress.images);
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
        const oldIndex = items.indexOf(items.find((image) => image.id === active.id) as ImageEntity);
        const newIndex = items.indexOf(items.find((image) => image.id === over.id) as ImageEntity);
        return arrayMove(items, oldIndex, newIndex);
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
        cloneItem.compositions = cloneItem.compositions.map((composition) => ({ id: composition.id } as  CompositionEntity));
        cloneOldItem.compositions = cloneOldItem.compositions.map((composition) => ({ id: composition.id } as  CompositionEntity));
      }
      if (cloneItem?.colors?.length) {
        cloneItem.colors = cloneItem.colors.map((color) => ({ id: color.id } as  ColorEntity));
        cloneOldItem.colors = cloneOldItem.colors.map((color) => ({ id: color.id } as  ColorEntity));
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
      const [itemH, itemM] = itemPublicationTime ? itemPublicationTime.split(':') : [null, null];
      const [tgH, tgM] = telegramPublicationTime ? telegramPublicationTime.split(':') : [null, null];

      if (values.publicationDate && itemH && itemM) {
        values.publicationDate = moment(values.publicationDate).set({ hour: +itemH, minute: +itemM }).toDate();
      } else {
        delete values.publicationDate;
      }
      if (values.deferredPublication?.date && tgH && tgM) {
        values.deferredPublication = {
          date: moment(values.deferredPublication?.date).set({ hour: +tgH, minute: +tgM }).toDate(),
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

  const generateDescription = async (isSubmitTgModal = false) => {
    try {
      setIsSubmit(true);
      const values = form.getFieldsValue();

      if (!values.compositions?.length || !images.length) {
        form.setFields([{ name: isSubmitTgModal ? ['deferredPublication', 'description'] : ['translations', lang as UserLangEnum, 'description'], errors: [tToast('requiredFields')] }]);
        throw new Error(tToast('requiredFields'));
      }

      values.images = images;
      values.compositions = compositions.filter((composition) => itemCompositions?.find((value) => typeof value === 'number' ? value === composition.id : value.id === composition.id)) as CompositionEntity[];

      const { data } = await axios.post<{ code: number; description: string; }>(routes.integration.gpt.generateDescriptionWithoutItem, values);

      if (data.code === 1) {
        if (!isSubmitTgModal) {
          form.setFields([{ name: ['translations', lang as UserLangEnum, 'description'], errors: [] }]);
          form.setFieldValue(['translations', lang as UserLangEnum, 'description'], data.description);
        } else {
          form.setFieldValue(['deferredPublication', 'description'], data.description);
        }
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const onSubmit = () => {
    form.validateFields().then(() => setIsFinish(true));
  };

  const itemPublicationDate = Form.useWatch('publicationDate', form);
  const telegramPublicationDate = Form.useWatch(['deferredPublication', 'date'], form);

  const saveProgress = useCallback(() => {
    const formValues = form.getFieldsValue();

    const rootValues = some(omit(formValues, 'translations'), value => typeof value === 'object' ? !isEmpty(value) : !!value);
    const nestedValues = some(formValues.translations, (langObj) => some(langObj, (value) => !isEmpty(value)));

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
    setTimeout(() => {
      if (itemName) {
        setBreadcrumbs((state) => [{ title: t('home') }, { title: t('catalog') }, itemGroup ? state[2] : { title: '' }, { title: itemName }]);
      } else if (!itemName && !itemGroup) {
        setBreadcrumbs([{ title: t('home') }, { title: t('catalog') }]);
      } else if (!itemName) {
        setBreadcrumbs((state) => [{ title: t('home') }, { title: t('catalog') }, itemGroup ? state[2] : { title: '' }]);
      }
    }, 1);
  }, [lang, itemName, itemGroup]);

  useEffect(() => {
    setTimeout(() => {
      if (itemGroup) {
        const name = itemGroup.translations.find((translation) => translation.lang === lang)?.name as string;
        setBreadcrumbs([{ title: t('home') }, { title: t('catalog') }, ...(itemName ? [{ title: name }, { title: itemName }] : [{ title: name }])]);
      } else if (!itemGroup && !itemName) {
        setBreadcrumbs([{ title: t('home') }, { title: t('catalog') }]);
      } else if (!itemGroup) {
        setBreadcrumbs((state) => [{ title: t('home') }, { title: t('catalog') }, { title: '' }, itemName ? state[3] : { title: '' }]);
      }
    }, 1);
  }, [lang, itemGroup, itemName]);

  useEffect(() => {
    if (axiosAuth) {
      Promise.all([
        axios.get(routes.composition.findMany),
        axios.get(routes.color.findMany),
      ])
        .then(([{ data: response1 }, { data: response2 }]) => {
          if (response1.code === 1) {
            setCompositions(response1.compositions);
          }
          if (response2.code === 1) {
            setColors(response2.colors);
          }
        })
        .catch((e) => {
          axiosErrorHandler(e, tToast);
        });
    }
  }, [axiosAuth]);

  useEffect(() => {
    if (!fetchedItemCollections) {
      axios.get<{ itemCollections: ItemCollectionInterface[]; }>(routes.itemCollection.findMany({ isServer: false }))
        .then(({ data }) => {
          setItemCollections(data.itemCollections);
        })
        .catch((e) => {
          axiosErrorHandler(e, tToast);
        });
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
    if (!oldItem) {
      const savedProgress = window.localStorage.getItem(process.env.NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY ?? '');
      if (savedProgress) {
        const parsedSavedProgress = JSON.parse(savedProgress) as { data: ItemFormInterface; lastProgress: Date; };

        const rootValues = some(omit(parsedSavedProgress.data, 'translations'), value => typeof value === 'object' ? !isEmpty(value) : !!value);
        const nestedValues = some(parsedSavedProgress.data.translations, (langObj) => some(langObj, (value) => !isEmpty(value)));

        if (rootValues || nestedValues || imagesRef.current.length) {
          setLastProgress(moment(parsedSavedProgress.lastProgress).format(DateFormatEnum.DD_MM_YYYY_HH_MM));
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!oldItem) {
      const timeAlive = setInterval(saveProgress, 10000);
      return () => clearInterval(timeAlive);
    }
  }, []);

  return isAdmin ? (
    <>
      <Helmet title={t(oldItem ? 'editTitle' : 'title')} description={t(oldItem ? 'editDescription' : 'description')} />
      {lastProgress ? (
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
      ) : null}
      {(oldItem || isMobile) ? null : <Breadcrumb items={breadcrumbs} className="fs-5 mb-5 font-oswald" separator={<RightOutlined className="fs-6" />} style={{ paddingTop: '10.5%' }} />}
      <div className="d-flex flex-column flex-xl-row mb-5 justify-content-between" style={isMobile ? { marginTop: '100px' } : {}}>
        {isMobile ? (
          <div className="d-flex align-items-center justify-content-between mb-4">
            {oldItem && <BackButton style={{}} className="px-2 py-0" />}
            <Switch className="switch-large" checkedChildren={t('onSortImage')} unCheckedChildren={t('unSortImage')} checked={isSortImage} onChange={sortImageHandler} />
          </div>
        ) : null}
        <div className="d-flex flex-column gap-3" style={{ width: isMobile ? '100%' : '40%' }}>
          {images.length
            ? isSortImage ? (
              <DndContext
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                modifiers={[restrictToWindowEdges]}
              >
                <SortableContext items={images} strategy={rectSortingStrategy}>
                  <div className="d-flex flex-wrap gap-3 mb-5 mb-xl-0">
                    {images.map((image, index) => <SortableItem image={image} key={image.id} index={index + 1} activeId={activeId} setImages={setImages} setFileList={setFileList} />)}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <ImageGallery
                ref={galleryRef}
                additionalClass="w-100 mb-5 mb-xl-0"
                showIndex
                items={images.map((image) => ({
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
                        style={{ maxHeight: originalHeight, width: '100%' }}
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
            )
            : null}
          <CropImage>
            {isMobile ? (
              <Upload className="w-100 mb-5 upload-button-center" {...props}>
                <Button className="button border-button mx-auto fs-5" icon={<UploadOutlined />}>{t('uploadMobileText')}</Button>
              </Upload>
            ) : (
              <Upload.Dragger {...props}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">{t('uploadText')}</p>
                <p className="ant-upload-hint">{t('uploadHint')}</p>
              </Upload.Dragger>
            )}
          </CropImage>
        </div>
        <div style={{ width: isMobile ? '100%' : '55%' }}>
          <Form name="create-item" scrollToFirstError initialValues={initialValues} className="d-flex flex-column" onFinish={onFinish} form={form}>
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
                <div className="d-flex flex-column flex-xl-row gap-2 mt-4">
                  <CancelBtn />
                  <OkBtn />
                </div>
              )}
            >
              <div className="d-flex flex-column align-items-center mt-4">
                <Divider className="font-oswald fs-5 mb-4">{t('modalSubmit.siteTitle')}</Divider>
                <div className="d-flex justify-content-between col-12 col-xl-10">
                  <Form.Item<ItemFormInterface> name="publicationDate" rules={[newItemValidation]} getValueProps={(value) => ({ value: value ? moment(value) : value })}>
                    <MomentDatePicker minDate={moment()} placeholder={t('modalSubmit.placeholderDate')} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={lang === UserLangEnum.RU ? locale : undefined} />
                  </Form.Item>
                  <Form.Item<ItemFormInterface>>
                    <TimePicker
                      onChange={(value) => setItemPublicationTime(value)}
                      value={itemPublicationTime}
                      minDate={itemPublicationDate}
                      placeholder={t('modalSubmit.placeholderTime')}
                      step={10}
                    />
                  </Form.Item>
                </div>
                <Divider className="font-oswald fs-5 mb-4">{t('modalSubmit.tgTitle')}</Divider>
                <div className="d-flex flex-column col-12 col-xl-10">
                  <div className="d-flex justify-content-between">
                    <Form.Item<ItemFormInterface> name={['deferredPublication', 'date']} rules={[newItemValidation]} getValueProps={(value) => ({ value: value ? moment(value) : value })}>
                      <MomentDatePicker minDate={moment()} placeholder={t('modalSubmit.placeholderDate')} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={lang === UserLangEnum.RU ? locale : undefined} />
                    </Form.Item>
                    <Form.Item<ItemFormInterface>>
                      <TimePicker
                        onChange={(value) => setTelegramPublicationTime(value)}
                        value={telegramPublicationTime}
                        minDate={telegramPublicationDate}
                        placeholder={t('modalSubmit.placeholderTime')}
                        step={10}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item<ItemFormInterface> name={['deferredPublication', 'description']} rules={[newItemValidation]}>
                    <Input.TextArea rows={6} placeholder={t('modalSubmit.enterDescription')} />
                  </Form.Item>
                  <div className="d-flex justify-content-end">
                    <Button style={{ background: 'linear-gradient(135deg,#fdd8a6,#f7daed)' }} onClick={() => generateDescription(true)}>{t('generateDescription')}</Button>
                  </div>
                </div>
              </div>
            </Modal>
            <div className="d-flex flex-column">
              <div className="d-flex flex-column flex-xl-row">
                <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.RU, 'name']} className="mb-4 large-input col-12 col-xl-6" rules={[newItemValidation]}>
                  <Input variant={isMobile ? 'outlined' : 'borderless'} size="large" placeholder={t('placeholders.name')} className="fw-500" style={{ fontSize: '1.75rem !important' }} />
                </Form.Item>
                <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.EN, 'name']} className="mb-4 large-input col-12 col-xl-6" rules={[newItemValidation]}>
                  <Input variant={isMobile ? 'outlined' : 'borderless'} size="large" placeholder={t('placeholders.nameEn')} className="fw-500" style={{ fontSize: '1.75rem !important' }} />
                </Form.Item>
              </div>
              <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center mb-4">
                <Form.Item<ItemFormInterface> name="group" className="large-input mb-4 mb-xl-0" rules={[newItemValidation]}>
                  <Select
                    showSearch={{
                      optionFilterProp: 'label',
                      filterSort: (optionA, optionB) => (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase()),
                    }}
                    allowClear
                    notFoundContent={<NotFoundContent />}
                    style={{ width: 200 }}
                    size="large"
                    placeholder={t('placeholders.group')}
                    variant={isMobile ? 'outlined' : 'borderless'}
                    onSelect={(groupId: number) => {
                      const group = itemGroups.find(({ id }) => id === groupId);
                      setItemGroup(group);
                      setItem((state) => ({ ...state, group }));
                    }}
                    onClear={() => setItemGroup(null)}
                    options={itemGroups.map(({ id, translations }) => ({ value: id, label: translations.find((translation) => translation.lang === lang)?.name }))}
                  />
                </Form.Item>
                <Form.Item<ItemFormInterface> name="collection" className="large-input mb-4 mb-xl-0">
                  <Select
                    showSearch={{
                      optionFilterProp: 'label',
                      filterSort: (optionA, optionB) => (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase()),
                    }}
                    allowClear
                    notFoundContent={<NotFoundContent />}
                    style={{ width: 200 }}
                    size="large"
                    placeholder={t('placeholders.collection')}
                    variant={isMobile ? 'outlined' : 'borderless'}
                    onSelect={(collectionId: number) => {
                      const collection = itemCollections.find((value) => value?.id === collectionId);
                      setItemCollection(collection);
                      setItem((state) => ({ ...state, collection }));
                    }}
                    onClear={() => setItemCollection(null)}
                    options={itemCollections.map((value) => ({ value: value?.id, label: value?.translations.find((translation) => translation.lang === lang)?.name }))}
                  />
                </Form.Item>
                <Form.Item<ItemFormInterface> name="new" valuePropName="checked" className="large-input mb-3 mb-xl-0">
                  <Checkbox className={cn({ 'not-padding': isMobile })}>{t('new')}</Checkbox>
                </Form.Item>
                <Form.Item<ItemFormInterface> name="bestseller" valuePropName="checked" className="large-input mb-1 mb-xl-0">
                  <Checkbox className={cn({ 'not-padding': isMobile })}>{t('bestseller')}</Checkbox>
                </Form.Item>
              </div>
              <div className={cn('d-flex flex-column flex-xl-row mb-4 gap-2 fs-2', { 'justify-content-between': !oldItem })}>
                <Form.Item<ItemFormInterface> name="price" rules={[newItemValidation]} className="col-6 col-xl-3">
                  <InputNumber size="large" variant={isMobile ? 'outlined' : 'borderless'} placeholder={t('placeholders.price')} prefix="₽" className="large-input ps-0 w-100" />
                </Form.Item>
                <Form.Item<ItemFormInterface> name="discountPrice" rules={[newItemValidation]} className="col-6 col-xl-3">
                  <InputNumber size="large" variant={isMobile ? 'outlined' : 'borderless'} placeholder={t('placeholders.discountPrice')} prefix="₽" className="large-input ps-0 w-100" />
                </Form.Item>
                <Form.Item<ItemFormInterface> name="isAbsent" valuePropName="checked" className="large-input mb-1 mb-xl-0">
                  <Checkbox className={cn({ 'not-padding': isMobile })}>{t('isAbsent')}</Checkbox>
                </Form.Item>
              </div>
              {!isMobile && (<div className="d-flex align-items-center gap-5 mb-4 position-relative">
                {oldItem && <BackButton style={{ position: 'absolute', left: '60%' }} />}
                <Button className="button border-button fs-5" onClick={oldItem ? form.submit : onSubmit}>{t(oldItem ? 'submitEditButton' : 'submitButton')}</Button>
                <Switch className="switch-large" checkedChildren={t('onSortImage')} unCheckedChildren={t('unSortImage')} checked={isSortImage} onChange={sortImageHandler} />
              </div>)}
              <div className="position-relative">
                <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.RU, 'description']} className="lh-lg" rules={[newItemValidation]}>
                  <Input.TextArea variant={isMobile ? 'outlined' : 'borderless'} className="font-oswald fs-5 p-xl-0" size="large" rows={3} placeholder={t('placeholders.description')} style={{ letterSpacing: '0.5px' }} />
                </Form.Item>
                {!isMobile && <Button className="generate-button" onClick={() => generateDescription()}>{t('generateDescription')}</Button>}
                <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.EN, 'description']} className="lh-lg" rules={[newItemValidation]}>
                  <Input.TextArea variant={isMobile ? 'outlined' : 'borderless'} className="font-oswald fs-5 p-xl-0" size="large" rows={3} placeholder={t('placeholders.descriptionEn')} style={{ letterSpacing: '0.5px' }} />
                </Form.Item>
              </div>
              {isMobile && (
                <div className="mb-4 text-center">
                  <Button style={{ background: 'linear-gradient(135deg,#fdd8a6,#f7daed)' }} onClick={() => generateDescription()}>{t('generateDescription')}</Button>
                </div>)}
              <div className="d-flex flex-column gap-3">
                <div className="d-flex flex-column gap-2">
                  <span className="font-oswald fs-6">{tCardItem('composition')}</span>
                  <Form.Item<ItemFormInterface> name="compositions" rules={[newItemValidation]}>
                    <Select
                      mode="multiple"
                      allowClear
                      className="col-6 font-oswald fs-5 p-xl-0"
                      size="large"
                      notFoundContent={<NotFoundContent />}
                      placeholder={t('placeholders.composition')}
                      variant={isMobile ? 'outlined' : 'borderless'}
                      showSearch={{
                        optionFilterProp: 'label',
                        filterSort: (optionA, optionB) => (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase()),
                      }}
                      onChange={(state) => setItemCompositions(state)}
                      onClear={() => setItemCompositions([])}
                      options={compositions?.map(({ id, translations }) => ({ value: id, label: translations.find((translation) => translation.lang === lang)?.name }))}
                    />
                  </Form.Item>
                </div>
                <div className="d-flex flex-column gap-2">
                  <span className="font-oswald fs-6">{tCardItem('color')}</span>
                  <Form.Item<ItemFormInterface> name="colors" rules={[newItemValidation]}>
                    <Select
                      mode="multiple"
                      allowClear
                      className="col-6 font-oswald fs-5 p-xl-0"
                      size="large"
                      notFoundContent={<NotFoundContent />}
                      placeholder={t('placeholders.color')}
                      variant={isMobile ? 'outlined' : 'borderless'}
                      showSearch={{
                        optionFilterProp: 'label',
                        filterOption: (input, option) => option?.label.props.children[1]?.props?.children?.toLowerCase().includes(input.toLowerCase()),
                      }}
                      onChange={(state) => setItemColors(state)}
                      onClear={() => setItemColors([])}
                      options={colors?.map(({ id, translations, hex }) => ({ value: id, label: (
                        <div className="d-flex align-items-center gap-2">
                          <span className="d-block" style={{ backgroundColor: hex, borderRadius: '50%', width: 25, height: 25 }} />
                          <span>{translations.find((translation) => translation.lang === lang)?.name}</span>
                        </div>
                      ) }))}
                    />
                  </Form.Item>
                </div>
                <div className="d-flex flex-column gap-2">
                  <span className="font-oswald fs-6">{tCardItem('length')}</span>
                  <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.RU, 'length']} rules={[newItemValidation]}>
                    <Input variant={isMobile ? 'outlined' : 'borderless'} className="font-oswald fs-5 p-xl-0" size="large" placeholder={t('placeholders.length')} />
                  </Form.Item>
                </div>
                <div className="d-flex flex-column gap-2">
                  <span className="font-oswald fs-6">{tCardItem('lengthEn')}</span>
                  <Form.Item<ItemFormInterface> name={['translations', UserLangEnum.EN, 'length']} rules={[newItemValidation]}>
                    <Input variant={isMobile ? 'outlined' : 'borderless'} className="font-oswald fs-5 p-xl-0" size="large" placeholder={t('placeholders.lengthEn')} />
                  </Form.Item>
                </div>
                {isMobile && (
                  <div className="d-flex justify-content-center">
                    <Button className="button border-button fs-5" onClick={oldItem ? form.submit : onSubmit}>{t(oldItem ? 'submitEditButton' : 'submitButton')}</Button>
                  </div>
                )}
              </div>
            </div>
          </Form>
        </div>
      </div>
    </>
  ) : null;
};

export default CreateItem;
