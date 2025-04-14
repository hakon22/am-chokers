import ImageGallery from 'react-image-gallery';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { RightOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useContext, useEffect, useRef, useState } from 'react';
import { Breadcrumb, Button, Form, Input, InputNumber, Select, Upload, type UploadProps, type UploadFile, Switch, Checkbox } from 'antd';
import { isEqual } from 'lodash';
import cn from 'classnames';
import axios from 'axios';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { routes } from '@/routes';
import { newItemValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { addItem, updateItem, deleteItemImage, type ItemWithUrlResponseInterface, addSpecialItem } from '@/slices/appSlice';
import { SortableItem } from '@/components/SortableItem';
import { NotFoundContent } from '@/components/NotFoundContent';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { BackButton } from '@/components/BackButton';
import { CropImage } from '@/components/CropImage';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { getHeight } from '@/utilities/screenExtension';
import type { ImageEntity } from '@server/db/entities/image.entity';
import type { CompositionEntity } from '@server/db/entities/composition.entity';
import type { ResponseFileInterface } from '@/types/storage/ResponseFileInterface';
import type { ItemCollectionInterface, ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { CompositionInterface } from '@/types/composition/CompositionInterface';
import type { ColorInterface } from '@/types/color/ColorInterface';
import type { ColorEntity } from '@server/db/entities/color.entity';

export const getServerSideProps = async () => {
  const { data: { itemCollections } } = await axios.get<{ itemCollections: ItemCollectionInterface[]; }>(routes.getItemCollections({ isServer: false }));

  return {
    props: {
      itemCollections,
    },
  };
};

const CreateItem = ({ itemCollections: fetchedItemCollections, oldItem, updateItem: updateStateItem }: { oldItem?: ItemInterface; itemCollections?: ItemCollectionInterface[]; updateItem?: (value: ItemInterface) => void }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.createItem' });
  const { t: tCardItem } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { role, token } = useAppSelector((state) => state.user);
  const { itemGroups, axiosAuth } = useAppSelector((state) => state.app);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [itemCollections, setItemCollections] = useState<ItemCollectionInterface[]>((fetchedItemCollections || []));

  const props: UploadProps<ResponseFileInterface> = {
    name: 'file',
    fileList,
    accept: 'image/png,image/jpg,image/jpeg',
    action: routes.imageUpload({ isServer: false }),
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

  const [breadcrumbs, setBreadcrumbs] = useState([
    {
      title: t('home'),
    },
    {
      title: t('catalog'),
    },
  ]);

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

  const [originalHeight, setOriginalHeight] = useState(416);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(isMobile ? isMobile : true);

  const [form] = Form.useForm<ItemInterface>();

  const itemName: string = Form.useWatch('name', form);

  const sortImageHandler = () => setIsSortImage(!isSortImage);

  const [activeId, setActiveId] = useState(0);

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

  const onFinish = async (values: ItemInterface) => {
    setIsSubmit(true);
    values.images = images;
    values.group = itemGroup as ItemGroupInterface;
    values.collection = itemCollection as ItemCollectionInterface;
    values.compositions = (itemCompositions ?? []).map((composition) => ({ id: typeof composition === 'number' ? composition : composition.id } as CompositionEntity));
    values.colors = (itemColors ?? []).map((color) => ({ id: typeof color === 'number' ? color : color.id } as ColorEntity));

    let code: number;
    if (oldItem) {
      if (item?.compositions?.length) {
        item.compositions = item.compositions.map((composition) => ({ id: composition.id } as  CompositionEntity));
      }
      if (item?.colors?.length) {
        item.colors = item.colors.map((color) => ({ id: color.id } as  ColorEntity));
      }
      if (isEqual(oldItem, { ...item, ...values })) {
        setIsSubmit(false);
        return;
      }
      const { payload } = await dispatch(updateItem({ id: oldItem.id, data: { ...oldItem, ...values } })) as { payload: ItemWithUrlResponseInterface; };
      code = payload.code;
      if (code === 1 && updateStateItem) {
        updateStateItem(payload.item);
        toast(tToast('itemUpdatedSuccess', { name: oldItem.name }), 'success');
        router.push(payload.url);
      }
    } else {
      const { payload } = await dispatch(addItem(values)) as { payload: ItemWithUrlResponseInterface; };
      code = payload.code;
      if (code === 1) {
        if (payload.item.new || payload.item.collection || payload.item.bestseller) {
          dispatch(addSpecialItem(payload.item));
        }
        setItem(undefined);
        setItemGroup(undefined);
        setItemCollection(undefined);
        setItemCompositions(undefined);
        setItemColors(undefined);
        setFileList([]);
        setImages([]);
        form.resetFields();
        form.setFieldValue('group', undefined);
        form.setFieldValue('collection', undefined);
        form.setFieldValue('compositions', undefined);
        form.setFieldValue('colors', undefined);
        window.open(payload.url, '_blank');
      }
    }

    if (code === 2) {
      form.setFields([{ name: 'name', errors: [tToast('itemExist', { name: values.name })] }]);
      toast(tToast('itemExist', { name: values.name }), 'error');
    }
    setIsSubmit(false);
  };

  useEffect(() => {
    if (itemName) {
      setBreadcrumbs((state) => [state[0], state[1], itemGroup ? state[2] : { title: '' }, { title: itemName }]);
    } else if (!itemName && !itemGroup) {
      setBreadcrumbs((state) => [state[0], state[1]]);
    } else if (!itemName) {
      setBreadcrumbs((state) => [state[0], state[1], itemGroup ? state[2] : { title: '' }]);
    }
  }, [itemName]);

  useEffect(() => {
    if (itemGroup) {
      setBreadcrumbs((state) => [state[0], state[1], ...(itemName ? [{ title: itemGroup.name }, { title: itemName }] : [{ title: itemGroup.name }])]);
    } else if (!itemGroup && !itemName) {
      setBreadcrumbs((state) => [state[0], state[1]]);
    } else if (!itemGroup) {
      setBreadcrumbs((state) => [state[0], state[1], { title: '' }, itemName ? state[3] : { title: '' }]);
    }
  }, [itemGroup]);

  useEffect(() => {
    if (axiosAuth) {
      Promise.all([
        axios.get(routes.getCompositions),
        axios.get(routes.getColors),
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
      axios.get<{ itemCollections: ItemCollectionInterface[]; }>(routes.getItemCollections({ isServer: false }))
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

  return role === UserRoleEnum.ADMIN ? (
    <>
      <Helmet title={t(oldItem ? 'editTitle' : 'title')} description={t(oldItem ? 'editDescription' : 'description')} />
      {oldItem ? null : isMobile ? null : <Breadcrumb items={breadcrumbs} className="fs-5 mb-5 font-oswald" separator={<RightOutlined className="fs-6" />} style={{ paddingTop: '10.5%' }} />}
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
                items={images.map((image) => ({ original: image.src, thumbnail: image.src, originalHeight: isMobile && originalHeight !== getHeight() ? undefined : originalHeight, originalWidth: isMobile && originalHeight === getHeight() ? originalHeight / 1.3 : undefined }))}
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
          <Form name="create-item" initialValues={{ ...item, group: itemGroup?.id, collection: itemCollection?.id, compositions: itemCompositions?.map((composition) => composition.id), colors: itemColors?.map((color) => color.id) }} className="d-flex flex-column" onFinish={onFinish} form={form}>
            <div className="d-flex flex-column">
              <Form.Item<typeof item> name="name" className="mb-4 large-input" rules={[newItemValidation]}>
                <Input variant={isMobile ? 'outlined' : 'borderless'} size="large" placeholder={t('placeholders.name')} style={{ fontSize: '1.75rem !important', fontWeight: 500 }} />
              </Form.Item>
              <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center mb-4">
                <Form.Item<typeof item> name="group" className="large-input mb-4 mb-xl-0" rules={[newItemValidation]}>
                  <Select
                    showSearch
                    allowClear
                    notFoundContent={<NotFoundContent />}
                    style={{ width: 200 }}
                    size="large"
                    placeholder={t('placeholders.group')}
                    variant={isMobile ? 'outlined' : 'borderless'}
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    onSelect={(groupId: number) => {
                      const group = itemGroups.find(({ id }) => id === groupId);
                      setItemGroup(group);
                      setItem((state) => ({ ...state, group }));
                    }}
                    onClear={() => setItemGroup(null)}
                    options={itemGroups.map(({ id, name }) => ({ value: id, label: name }))}
                  />
                </Form.Item>
                <Form.Item<typeof item> name="collection" className="large-input mb-4 mb-xl-0">
                  <Select
                    showSearch
                    allowClear
                    notFoundContent={<NotFoundContent />}
                    style={{ width: 200 }}
                    size="large"
                    placeholder={t('placeholders.collection')}
                    variant={isMobile ? 'outlined' : 'borderless'}
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    onSelect={(collectionId: number) => {
                      const collection = itemCollections.find(({ id }) => id === collectionId);
                      setItemCollection(collection);
                      setItem((state) => ({ ...state, collection }));
                    }}
                    onClear={() => setItemCollection(null)}
                    options={itemCollections.map(({ id, name }) => ({ value: id, label: name }))}
                  />
                </Form.Item>
                <Form.Item<typeof item> name="new" valuePropName="checked" className="large-input mb-3 mb-xl-0">
                  <Checkbox className={cn({ 'not-padding': isMobile })}>{t('new')}</Checkbox>
                </Form.Item>
                <Form.Item<typeof item> name="bestseller" valuePropName="checked" className="large-input mb-1 mb-xl-0">
                  <Checkbox className={cn({ 'not-padding': isMobile })}>{t('bestseller')}</Checkbox>
                </Form.Item>
              </div>
              <div className={cn('d-flex flex-column flex-xl-row mb-4 gap-2 fs-2', { 'justify-content-between': !oldItem })}>
                <Form.Item<typeof item> name="price" rules={[newItemValidation]} className="col-6 col-xl-3">
                  <InputNumber size="large" variant={isMobile ? 'outlined' : 'borderless'} placeholder={t('placeholders.price')} prefix="₽" className="large-input ps-0 w-100" />
                </Form.Item>
                <Form.Item<typeof item> name="discountPrice" rules={[newItemValidation]} className="col-6 col-xl-3">
                  <InputNumber size="large" variant={isMobile ? 'outlined' : 'borderless'} placeholder={t('placeholders.discountPrice')} prefix="₽" className="large-input ps-0 w-100" />
                </Form.Item>
              </div>
              {!isMobile && (<div className="d-flex align-items-center gap-5 mb-4 position-relative">
                {oldItem && <BackButton style={{ position: 'absolute', left: '60%' }} />}
                <Button className="button border-button fs-5" htmlType="submit">{t(oldItem ? 'submitEditButton' : 'submitButton')}</Button>
                <Switch className="switch-large" checkedChildren={t('onSortImage')} unCheckedChildren={t('unSortImage')} checked={isSortImage} onChange={sortImageHandler} />
              </div>)}
              <Form.Item<typeof item> name="description" className="lh-lg large-input" rules={[newItemValidation]}>
                <Input.TextArea variant={isMobile ? 'outlined' : 'borderless'} size="large" rows={2} placeholder={t('placeholders.description')} style={{ letterSpacing: '0.5px' }} />
              </Form.Item>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex flex-column gap-2">
                  <span className="font-oswald fs-6">{tCardItem('composition')}</span>
                  <Form.Item<typeof item> name="compositions" className="large-input" rules={[newItemValidation]}>
                    <Select
                      mode="multiple"
                      allowClear
                      className="col-6"
                      size="large"
                      notFoundContent={<NotFoundContent />}
                      placeholder={t('placeholders.composition')}
                      variant={isMobile ? 'outlined' : 'borderless'}
                      optionFilterProp="label"
                      filterSort={(optionA, optionB) =>
                        (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                      }
                      onChange={(state) => setItemCompositions(state)}
                      onClear={() => setItemCompositions([])}
                      options={compositions?.map(({ id, name }) => ({ value: id, label: name }))}
                    />
                  </Form.Item>
                </div>
                <div className="d-flex flex-column gap-2">
                  <span className="font-oswald fs-6">{tCardItem('color')}</span>
                  <Form.Item<typeof item> name="colors" className="large-input" rules={[newItemValidation]}>
                    <Select
                      mode="multiple"
                      allowClear
                      className="col-6"
                      size="large"
                      notFoundContent={<NotFoundContent />}
                      placeholder={t('placeholders.color')}
                      variant={isMobile ? 'outlined' : 'borderless'}
                      optionFilterProp="label"
                      filterOption={(input, option) => 
                        option?.label.props.children[1]?.props?.children?.toLowerCase().includes(input.toLowerCase())
                      }
                      onChange={(state) => setItemColors(state)}
                      onClear={() => setItemColors([])}
                      options={colors?.map(({ id, name, hex }) => ({ value: id, label: (
                        <div className="d-flex align-items-center gap-2">
                          <span className="d-block" style={{ backgroundColor: hex, borderRadius: '50%', width: 25, height: 25 }} />
                          <span>{name}</span>
                        </div>
                      ) }))}
                    />
                  </Form.Item>
                </div>
                <div className="d-flex flex-column gap-2">
                  <span className="font-oswald fs-6">{tCardItem('length')}</span>
                  <Form.Item<typeof item> name="length" className="large-input" rules={[newItemValidation]}>
                    <Input variant={isMobile ? 'outlined' : 'borderless'} size="large" placeholder={t('placeholders.length')} />
                  </Form.Item>
                </div>
                {isMobile && (
                  <div className="d-flex justify-content-center">
                    <Button className="button border-button fs-5" htmlType="submit">{t(oldItem ? 'submitEditButton' : 'submitButton')}</Button>
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
