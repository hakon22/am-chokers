import ImageGallery from 'react-image-gallery';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { RightOutlined, InboxOutlined  } from '@ant-design/icons';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useContext, useEffect, useRef, useState } from 'react';
import { Breadcrumb, Button, Form, Input, InputNumber, Select, message, Upload, type UploadProps, type UploadFile, Switch } from 'antd';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { SubmitContext } from '@/components/Context';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import { routes } from '@/routes';
import type { ImageEntity } from '@server/db/entities/image.entity';
import { NoAuthorization } from '@/components/NoAuthorization';
import { setUrl } from '@/slices/userSlice';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { newItemValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { addItem } from '@/slices/appSlice';
import SortableItem from '@/components/SortableItem';

type ResponseFile = {
  code: number;
  message: string;
  image: ImageEntity;
};

const CreateItem = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.createItem' });
  const { t: tCardItem } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { role, token } = useAppSelector((state) => state.user);
  const { itemGroups } = useAppSelector((state) => state.app);

  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const props: UploadProps<ResponseFile> = {
    name: 'file',
    multiple: true,
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
        message.success(t('success', { fileName: info.file.name }));
        setImages((state) => [...state, response.image]);
      } else if (status === 'error') {
        message.error(response?.message);
      }
    },
    onRemove(file) {
      setImages((state) => state.filter((image) => image.id !== file.response?.image.id));
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

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);

  const galleryRef = useRef<ImageGallery>(null);

  const [item, setItem] = useState<Partial<ItemInterface>>();
  const [images, setImages] = useState<ItemInterface['images']>([]);
  const [itemGroup, setItemGroup] = useState<ItemGroupInterface>();
  const [isSortImage, setIsSortImage] = useState(false);

  const [form] = Form.useForm();

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
    values.group = itemGroup as ItemInterface['group'];
    const { payload: { code, url } } = await dispatch(addItem(values)) as { payload: { code: number; item: ItemInterface; url: string; } };
    if (code === 1) {
      setItem(undefined);
      setItemGroup(undefined);
      setFileList([]);
      setImages([]);
      form.resetFields();
      window.open(url, '_blank');
    } else if (code === 2) {
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
    if (!role) {
      dispatch(setUrl(router.asPath));
    } else if (role === UserRoleEnum.MEMBER) {
      router.push(routes.homePage);
    }
  }, [role]);

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      {role ? (
        <>
          <Breadcrumb items={breadcrumbs} className="fs-5 mb-5 font-oswald" separator={<RightOutlined className="fs-6" />} style={{ paddingTop: '10.5%' }} />
          <div className="d-flex mb-5 justify-content-between">
            <div className="d-flex flex-column gap-3" style={{ width: '40%' }}>
              {images.length
                ? isSortImage ? (
                  <DndContext
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                    modifiers={[restrictToWindowEdges]}
                  >
                    <SortableContext items={images} strategy={rectSortingStrategy}>
                      <div className="d-flex flex-wrap gap-3">
                        {images.map((image, index) => <SortableItem image={image} key={image.id} index={index + 1} activeId={activeId} />)}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (<ImageGallery
                  ref={galleryRef}
                  items={images.map(({ name, path }) => ({ original: `${path}/${name}`, thumbnail: `${path}/${name}` }))}
                  infinite
                  showNav
                  onScreenChange={(fullscreen) => (fullscreen ? document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 110px)') : document.documentElement.style.setProperty('--galleryWidth', 'calc(80% - 110px)'))}
                  showPlayButton={false}
                  thumbnailPosition="left"
                  onClick={() => galleryRef.current?.fullScreen()}
                />)
                : null}
              <Upload.Dragger {...props}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">{t('uploadText')}</p>
                <p className="ant-upload-hint">{t('uploadHint')}</p>
              </Upload.Dragger>
            </div>
            <div style={{ width: '55%' }}>
              <Form name="create-item" initialValues={item} className="d-flex flex-column" onFinish={onFinish} form={form}>
                <div className="d-flex flex-column">
                  <Form.Item<ItemInterface> name="name" className="mb-4 large-input" rules={[newItemValidation]}>
                    <Input variant="borderless" size="large" placeholder={t('placeholders.name')} style={{ fontSize: '1.75rem !important', fontWeight: 500 }} />
                  </Form.Item>
                  <Form.Item<ItemInterface> name="group" className="mb-4 large-input" rules={[newItemValidation]}>
                    <Select
                      showSearch
                      style={{ width: 200 }}
                      size="large"
                      placeholder={t('placeholders.group')}
                      variant="borderless"
                      onSelect={(groupId: number) => {
                        const group = itemGroups.find(({ id }) => id === groupId);
                        setItemGroup(group);
                        setItem((state) => ({ ...state, group }));
                      }}
                      options={itemGroups.map(({ id, name }) => ({ value: id, label: name }))}
                    />
                  </Form.Item>
                  <div className="d-flex flex-column flex-md-row justify-content-between">
                    <Form.Item<ItemInterface> name="price" className="mb-4 fs-2" rules={[newItemValidation]}>
                      <InputNumber size="large" variant="borderless" placeholder={t('placeholders.price')} prefix="₽" className="large-input ps-0 w-100" />
                    </Form.Item>
                    <Form.Item<ItemInterface> name="width" className="mb-4 fs-2" rules={[newItemValidation]}>
                      <InputNumber size="large" variant="borderless" placeholder={t('placeholders.width')} className="large-input ps-0 w-100" />
                    </Form.Item>
                    <Form.Item<ItemInterface> name="height" className="mb-4 fs-2" rules={[newItemValidation]}>
                      <InputNumber size="large" variant="borderless" placeholder={t('placeholders.height')} className="large-input ps-0 w-100" />
                    </Form.Item>
                  </div>
                  <div className="d-flex align-items-center gap-5 mb-4">
                    <Button className="button border-button fs-5" htmlType="submit">{t('submitButton')}</Button>
                    <Switch className="switch-large" checkedChildren={t('onSortImage')} unCheckedChildren={t('unSortImage')} checked={isSortImage} onChange={sortImageHandler} />
                  </div>
                  <Form.Item<ItemInterface> name="description" className="lh-lg large-input" rules={[newItemValidation]}>
                    <Input.TextArea variant="borderless" size="large" rows={2} placeholder={t('placeholders.description')} style={{ letterSpacing: '0.5px' }} />
                  </Form.Item>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex flex-column gap-2">
                      <span className="font-oswald fs-6">{tCardItem('composition')}</span>
                      <Form.Item<ItemInterface> name="composition" className="large-input" rules={[newItemValidation]}>
                        <Input.TextArea variant="borderless" size="large" placeholder={t('placeholders.composition')} rows={1} />
                      </Form.Item>
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <span className="font-oswald fs-6">{tCardItem('length')}</span>
                      <Form.Item<ItemInterface> name="length" className="large-input" rules={[newItemValidation]}>
                        <Input variant="borderless" size="large" placeholder={t('placeholders.length')} />
                      </Form.Item>
                    </div>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </>
      ) : <NoAuthorization />}
    </>
  );
};

export default CreateItem;
