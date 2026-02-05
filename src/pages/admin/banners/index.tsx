import { useTranslation } from 'react-i18next';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  Tag,
  Upload,
  type TableProps,
  type UploadFile,
  type UploadProps,
} from 'antd';
import axios from 'axios';
import { HolderOutlined, UploadOutlined } from '@ant-design/icons';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { ValidationError } from 'yup';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/hooks/reduxHooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { newBannerValidation } from '@/validations/validations';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { BannerMediaTypeEnum } from '@server/types/banner/enums/banner.media.type.enum';
import { toast } from '@/utilities/toast';
import type { BannerInterface, BannerListResponseInterface, BannerResponseInterface } from '@/types/banner/BannerInterface';
import type { ImageEntity } from '@server/db/entities/image.entity';
import type { ResponseFileInterface } from '@/types/storage/ResponseFileInterface';

interface BannerTableInterface {
  key: string;
  name: string;
  link?: string | null;
  copyValue?: string | null;
  order?: number;
  deleted?: Date | null;
  desktopVideo?: ImageEntity;
  mobileVideo?: ImageEntity;
}

interface BannerFormValues {
  name: string;
  link?: string | null;
  copyValue?: string | null;
  desktopVideo?: ImageEntity;
  mobileVideo?: ImageEntity;
}

interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const RowContext = createContext<RowContextProps>({});

const UseDragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      className="border-0"
      icon={<HolderOutlined />}
      style={{ cursor: 'move' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

const normalizeValue = (value?: string | null) => (value?.trim() ? value.trim() : null);

const toUploadFile = (image?: ImageEntity): UploadFile<ResponseFileInterface>[] => {
  if (!image) {
    return [];
  }
  return [{
    uid: image.id.toString(),
    name: image.name,
    status: 'done',
    url: image.src,
    response: { image } as ResponseFileInterface,
  }];
};

const isVideoSrc = (src?: string) => !!src && /\.(mp4|webm|mov)$/i.test(src);

const renderMediaPreview = (src?: string, className?: string, style?: React.CSSProperties) => {
  if (!src) {
    return null;
  }

  if (isVideoSrc(src)) {
    return (
      <video
        src={src}
        className={className}
        style={style}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
      />
    );
  }

  const { objectFit, maxHeight, height, width, ...restStyle } = style ?? {};
  const resolvedHeight = typeof height === 'number'
    ? height
    : typeof maxHeight === 'number'
      ? maxHeight
      : undefined;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: resolvedHeight ?? height,
        ...restStyle,
      }}
    >
      <Image
        src={src}
        alt="Preview"
        unoptimized
        width={typeof width === 'number' ? width : 300}
        height={typeof height === 'number' ? height : Math.round(300 * 1.3)}
        style={{ objectFit: (objectFit as React.CSSProperties['objectFit']) ?? 'cover' }}
      />
    </div>
  );
};

const CreateBanners = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.banner' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { isAdmin, token } = useAppSelector((state) => state.user);
  const { axiosAuth } = useAppSelector((state) => state.app);

  const router = useRouter();
  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [form] = Form.useForm<BannerFormValues>();

  const [data, setData] = useState<BannerTableInterface[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerInterface | null>(null);
  const [desktopFileList, setDesktopFileList] = useState<UploadFile<ResponseFileInterface>[]>([]);
  const [mobileFileList, setMobileFileList] = useState<UploadFile<ResponseFileInterface>[]>([]);
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));

  const Row: React.FC<RowProps> = (props) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: props['data-row-key'] });

    const style: React.CSSProperties = {
      ...props.style,
      transform: CSS.Translate.toString(transform),
      transition,
      cursor: 'unset',
      ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    const contextValue = useMemo<RowContextProps>(() => ({ setActivatorNodeRef, listeners }), [setActivatorNodeRef, listeners]);

    return (
      <RowContext.Provider value={contextValue}>
        <tr {...props} ref={setNodeRef} style={style} {...attributes} />
      </RowContext.Provider>
    );
  };

  const parseBanner = (banner: BannerInterface): BannerTableInterface => ({
    ...banner,
    key: banner.id.toString(),
  });

  const fetchBanners = async () => {
    setIsSubmit(true);
    try {
      const { data: response } = await axios.get<BannerListResponseInterface>(routes.banner.findMany({ isServer: false }), {
        params: { withDeleted },
      });
      if (response.code === 1) {
        setData(response.banners.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(parseBanner));
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
    setIsSubmit(false);
  };

  const withDeletedHandler = () => setWithDeleted(!withDeleted);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setData((prevState) => {
        const activeIndex = prevState.findIndex((record) => record.key === active?.id);
        const overIndex = prevState.findIndex((record) => record.key === over?.id);
        return arrayMove(prevState, activeIndex, overIndex);
      });
      setIsSorting(true);
    }
  };

  const reorder = async () => {
    setIsSubmit(true);
    try {
      const payload = data.map((item) => ({ id: +item.key }));
      const { data: response } = await axios.patch<BannerListResponseInterface>(routes.banner.reorder, payload);
      if (response.code === 1) {
        setData(response.banners.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(parseBanner));
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
    setIsSubmit(false);
  };

  const openCreateModal = () => {
    form.resetFields();
    setEditingBanner(null);
    setDesktopFileList([]);
    setMobileFileList([]);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: BannerInterface) => {
    setEditingBanner(banner);
    form.setFieldsValue({
      name: banner.name,
      link: banner.link ?? '',
      copyValue: banner.copyValue ?? '',
      desktopVideo: banner.desktopVideo,
      mobileVideo: banner.mobileVideo,
    });
    setDesktopFileList(toUploadFile(banner.desktopVideo));
    setMobileFileList(toUploadFile(banner.mobileVideo));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    form.resetFields();
    setEditingBanner(null);
    setDesktopFileList([]);
    setMobileFileList([]);
    setIsModalOpen(false);
  };

  const removeUploadedMedia = async (file: UploadFile<ResponseFileInterface>) => {
    const id = file.response?.image?.id;
    if (!id) {
      return;
    }
    await axios.delete(routes.storage.image.deleteOne(id));
  };

  const getUploadAction = (type: BannerMediaTypeEnum) => `${routes.storage.image.upload({ isServer: false })}?bannerType=${type}`;

  const uploadConfig = (type: BannerMediaTypeEnum): UploadProps<ResponseFileInterface> => ({
    name: 'file',
    accept: 'image/*,video/mp4,video/webm,video/quicktime',
    action: getUploadAction(type),
    headers: {
      Authorization: `Bearer ${token}`,
    },
    maxCount: 1,
    beforeUpload: (file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) {
        toast(t('validation.videoOnly'), 'error');
      }
      return isVideo || isImage || Upload.LIST_IGNORE;
    },
  });

  const onUploadChange = (type: BannerMediaTypeEnum) => (info: { file: UploadFile<ResponseFileInterface>; fileList: UploadFile<ResponseFileInterface>[]; }) => {
    const { file, fileList } = info;
    if (type === BannerMediaTypeEnum.DESKTOP) {
      setDesktopFileList(fileList);
    } else {
      setMobileFileList(fileList);
    }
    if (file.status === 'done' && file.response?.image) {
      form.setFieldValue(type === BannerMediaTypeEnum.DESKTOP ? 'desktopVideo' : 'mobileVideo', file.response.image);
      toast(t('uploadSuccess', { name: file.name }), 'success');
    } else if (file.status === 'error') {
      toast(file.response?.message || t('uploadError'), 'error');
    }
  };

  const onUploadRemove = (type: BannerMediaTypeEnum) => async (file: UploadFile<ResponseFileInterface>) => {
    await removeUploadedMedia(file);
    form.setFieldValue(type === BannerMediaTypeEnum.DESKTOP ? 'desktopVideo' : 'mobileVideo', undefined);
  };

  const handleDelete = async (record: BannerTableInterface) => {
    setIsSubmit(true);
    try {
      const { data: response } = await axios.delete<BannerResponseInterface>(routes.banner.deleteOne(+record.key));
      if (response.code === 1) {
        if (withDeleted) {
          setData((state) => state.map((item) => (item.key === record.key ? parseBanner(response.banner) : item)));
        } else {
          setData((state) => state.filter((item) => item.key !== record.key));
        }
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
    setIsSubmit(false);
  };

  const handleRestore = async (key: React.Key) => {
    setIsSubmit(true);
    try {
      const { data: response } = await axios.patch<BannerResponseInterface>(routes.banner.restoreOne(+key.toString()));
      if (response.code === 1) {
        setData((state) => state.map((item) => (item.key === key.toString() ? parseBanner(response.banner) : item)));
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
    setIsSubmit(false);
  };

  const handleSubmit = async () => {
    const formValues = form.getFieldsValue();
    try {
      await newBannerValidation.serverValidator(formValues);
    } catch (e) {
      if (e instanceof Error && 'inner' in e) {
        const yupError = e as ValidationError;
        if (yupError?.inner?.length) {
          form.setFields(
            yupError.inner
              .map((err) => {
                const name = err.path as keyof BannerFormValues | undefined;
                if (!name) {
                  return null;
                }
                return {
                  name,
                  errors: [err.message],
                };
              })
              .filter((field): field is { name: keyof BannerFormValues; errors: string[] } => !!field),
          );
        }
      }
      toast(tToast('requiredFields'), 'error');
      return;
    }

    setIsSubmit(true);
    try {
      const payload = {
        ...formValues,
        link: normalizeValue(formValues.link),
        copyValue: normalizeValue(formValues.copyValue),
      };

      if (editingBanner) {
        const { data: response } = await axios.put<BannerResponseInterface>(routes.banner.updateOne(editingBanner.id), payload);
        if (response.code === 1) {
          setData((state) => state.map((item) => (item.key === editingBanner.id.toString() ? parseBanner(response.banner) : item)));
          toast(t('updateSuccess', { name: response.banner.name }), 'success');
        }
      } else {
        const { data: response } = await axios.post<BannerResponseInterface>(routes.banner.createOne, payload);
        if (response.code === 1) {
          setData((state) => [...state, parseBanner(response.banner)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
          toast(t('createSuccess', { name: response.banner.name }), 'success');
        }
      }
      closeModal();
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
    setIsSubmit(false);
  };

  const columns: TableProps<BannerTableInterface>['columns'] = [
    {
      key: 'sort',
      width: 70,
      render: () => <UseDragHandle />,
    },
    {
      title: t('columns.preview'),
      dataIndex: 'preview',
      width: 120,
      render: (_: unknown, record: BannerTableInterface) => (
        record.desktopVideo?.src
          ? renderMediaPreview(record.desktopVideo.src, 'rounded', { width: 90, height: 90, objectFit: 'cover' })
          : <span className="text-muted">—</span>
      ),
    },
    {
      title: t('columns.name'),
      dataIndex: 'name',
      render: (_: unknown, record: BannerTableInterface) => (
        <div className="d-flex align-items-center gap-3">
          <span>{record.name}</span>
          {record.deleted ? <Tag color="volcano" variant="outlined">{t('deleted')}</Tag> : null}
        </div>
      ),
    },
    {
      title: t('columns.status'),
      dataIndex: 'status',
      width: 140,
      render: (_: unknown, record: BannerTableInterface) => (
        <Tag color={record.deleted ? 'volcano' : 'green'} variant="outlined">
          {record.deleted ? t('status.deleted') : t('status.active')}
        </Tag>
      ),
    },
    {
      title: t('columns.order'),
      dataIndex: 'order',
      width: 120,
      render: (value: number | undefined) => (typeof value === 'number' ? value + 1 : '—'),
    },
    {
      title: t('columns.operation'),
      dataIndex: 'operation',
      render: (_: unknown, record: BannerTableInterface) => (
        <div className="d-flex gap-2">
          {!record.deleted ? (
            <>
              <Button color="default" variant="text" onClick={() => openEditModal(record as unknown as BannerInterface)}>
                {t('edit')}
              </Button>
              <Popconfirm
                rootClassName="ant-input-group-addon"
                title={t('deleteConfirm')}
                okText={t('okText')}
                cancelText={t('cancel')}
                onConfirm={() => handleDelete(record)}
              >
                <Button color="default" variant="text">
                  {t('delete')}
                </Button>
              </Popconfirm>
            </>
          ) : (
            <Button color="default" variant="text" onClick={() => handleRestore(record.key)}>
              {t('restore')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    if ((withDeleted !== undefined || !data.length) && axiosAuth) {
      router.push(`?withDeleted=${withDeleted}`, undefined, { shallow: true });
      fetchBanners();
    }
  }, [withDeleted, axiosAuth]);

  useEffect(() => {
    if (isSorting) {
      reorder();
      setIsSorting(false);
    }
  }, [isSorting]);

  return isAdmin ? (
    <div className="d-flex flex-column mb-5 justify-content-center" style={isMobile ? { marginTop: '50px' } : {}}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: '12%' }}>{t('title')}</h1>
      <div className="d-flex flex-column justify-content-center">
        <div className="mb-3">
          <BackButton style={{}} />
        </div>
        <div className="d-flex align-items-center gap-3 mb-3">
          <Button onClick={openCreateModal} className="button border-button">
            {t('addBanner')}
          </Button>
          <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
        </div>
      </div>
      <Form form={form} component={false} className="d-flex flex-column gap-3" style={{ width: '60%' }}>
        <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext items={data.map(({ key }) => key)} strategy={verticalListSortingStrategy}>
            <Table<BannerTableInterface>
              components={{
                body: { row: Row },
              }}
              bordered
              dataSource={data}
              locale={{
                emptyText: <NotFoundContent />,
              }}
              columns={columns}
              pagination={false}
            />
          </SortableContext>
        </DndContext>
      </Form>
      <Modal
        centered
        open={isModalOpen}
        title={editingBanner ? t('modal.editTitle') : t('modal.createTitle')}
        okText={editingBanner ? t('save') : t('create')}
        cancelText={t('cancel')}
        onCancel={closeModal}
        zIndex={10000}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t('form.name')} rules={[newBannerValidation]}>
            <Input placeholder={t('form.namePlaceholder')} />
          </Form.Item>
          <Form.Item name="link" label={t('form.link')} rules={[newBannerValidation]}>
            <Input placeholder={t('form.linkPlaceholder')} />
          </Form.Item>
          <Form.Item name="copyValue" label={t('form.copyValue')} rules={[newBannerValidation]}>
            <Input placeholder={t('form.copyValuePlaceholder')} />
          </Form.Item>
          <Form.Item
            name="desktopVideo"
            label={t('form.desktopVideo')}
            rules={[newBannerValidation]}
            valuePropName="value"
            getValueFromEvent={() => form.getFieldValue('desktopVideo')}
          >
            <Upload
              {...uploadConfig(BannerMediaTypeEnum.DESKTOP)}
              fileList={desktopFileList}
              onChange={onUploadChange(BannerMediaTypeEnum.DESKTOP)}
              onRemove={onUploadRemove(BannerMediaTypeEnum.DESKTOP)}
            >
              <Button icon={<UploadOutlined />}>{t('form.uploadDesktop')}</Button>
            </Upload>
            {renderMediaPreview(
              desktopFileList[0]?.response?.image?.src,
              'rounded mt-2',
              { width: '100%', maxHeight: 240, objectFit: 'cover' },
            )}
          </Form.Item>
          <Form.Item
            name="mobileVideo"
            label={t('form.mobileVideo')}
            rules={[newBannerValidation]}
            valuePropName="value"
            getValueFromEvent={() => form.getFieldValue('mobileVideo')}
          >
            <Upload
              {...uploadConfig(BannerMediaTypeEnum.MOBILE)}
              fileList={mobileFileList}
              onChange={onUploadChange(BannerMediaTypeEnum.MOBILE)}
              onRemove={onUploadRemove(BannerMediaTypeEnum.MOBILE)}
            >
              <Button icon={<UploadOutlined />}>{t('form.uploadMobile')}</Button>
            </Upload>
            {renderMediaPreview(
              mobileFileList[0]?.response?.image?.src,
              'rounded mt-2',
              { width: 300, maxHeight: Math.round(300 * 1.3), objectFit: 'cover' },
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  ) : null;
};

export default CreateBanners;
