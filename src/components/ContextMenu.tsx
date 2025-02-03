import { Button, Dropdown, Form, message, Popconfirm, Select, Upload } from 'antd';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import ImgCrop from 'antd-img-crop';
import type { MenuProps } from 'antd';

import { SubmitContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { deleteItem, type ItemResponseInterface, partialUpdateItem, removeCoverImage, setCoverImage } from '@/slices/appSlice';
import { toast } from '@/utilities/toast';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { getHref } from '@/utilities/getHref';
import { NotFoundContent } from '@/components/NotFoundContent';
import { ImageEntity } from '@server/db/entities/image.entity';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import type { ItemInterface } from '@/types/item/Item';

export type Context = { action: string, id: number } | undefined;
export type SetContext = React.Dispatch<React.SetStateAction<Context>>;

interface CardContextMenuProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  order?: number;
  cover?: number;
  item?: ItemInterface;
  image?: ImageEntity;
}

export const ContextMenu = ({ children, order, cover, item, image, ...props }: CardContextMenuProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.contextMenu' });
  const { t: tUpload } = useTranslation('translation', { keyPrefix: 'modules.uploadImage' });
  const { t: tCrop } = useTranslation('translation', { keyPrefix: 'modules.imageCrop' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const router = useRouter();

  const { role, token } = useAppSelector((state) => state.user);
  const { items } = useAppSelector((state) => state.app);

  const { bestsellers, collections } = items.reduce((acc, value) => {
    if (value.order) return acc;

    if (value.bestseller) {
      acc.bestsellers.push(value);
    }
    if (value.collection) {
      acc.collections.push(value);
    }
    return acc;
  }, { bestsellers: [], collections: [] } as { bestsellers: ItemInterface[]; collections: ItemInterface[]; });

  const [isSelect, setIsSelect] = useState(false);
  const [isUpload, setIsUpload] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemInterface>();
  const [uploadedImage, setUploadedImage] = useState<ImageEntity>();

  const uploadRef = useRef<HTMLButtonElement>(null);

  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);

  const handleDelete = async (target: ItemInterface) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, item: deletedItem } } = await dispatch(deleteItem(target.id)) as { payload: ItemResponseInterface };
    if (payloadCode === 1) {
      toast(tToast('itemDeletedSuccess', { name: deletedItem.name }), 'success');
    }
    setIsSubmit(false);
  };

  const handleUpdate = async (target: ItemInterface, value: undefined | number) => {
    setIsSubmit(true);
    await dispatch(partialUpdateItem({ id: target.id, data: { order: value } }));
    setIsSubmit(false);
  };

  const uploadCover = async (target: ImageEntity, value: number) => {
    try {
      setIsSubmit(true);
      await dispatch(setCoverImage({ id: target.id, coverOrder: value }));
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const removeCover = async (target: ImageEntity) => {
    setIsSubmit(true);
    await dispatch(removeCoverImage(target.id));
    setIsSubmit(false);
  };

  const menu: MenuProps['items'] = order
    ? [
      ...(item ? [{
        label: t('edit'),
        key: '1',
        onClick: () => router.push({ pathname: getHref(item), query: { edit: true } }),
      },
      {
        label: (<Popconfirm title={t('deleteConfirm')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => handleDelete(item)}>{t('remove')}</Popconfirm>),
        key: '2',
      },
      {
        label: t('removeInCell'),
        key: '3',
        onClick: () => handleUpdate(item, null as unknown as number),
      }] : []),
      ...(!item ? [{
        label: t('addInCell'),
        key: '4',
        onClick: () => setIsSelect(true),
      }] : []),
    ]
    : !order && cover
      ? [
        ...(!image ? [{
          label: t('uploadCover'),
          key: '1',
          onClick: () => setIsUpload(true),
        }] : []),
        ...(image ? [{
          label: (<Popconfirm title={t('deleteCoverConfirm')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => removeCover(image)}>{t('removeCover')}</Popconfirm>),
          key: '2',
        }] : []),
      ]
      : [];

  useEffect(() => {
    if (isSelect) {
      return () => setIsSelect(false);
    }
  }, [isSelect]);

  useEffect(() => {
    if (isUpload && uploadRef.current) {
      uploadRef.current.click();
      return () => setIsUpload(false);
    }
  }, [isUpload]);

  useEffect(() => {
    if (selectedItem) {
      handleUpdate(selectedItem, order).then(() => {
        setSelectedItem(undefined);
        setIsSelect(false);
      });
    }
  }, [selectedItem]);

  useEffect(() => {
    if (uploadedImage && cover) {
      uploadCover(uploadedImage, cover).then(() => {
        setUploadedImage(undefined);
        setIsUpload(false);
      });
    }
  }, [uploadedImage]);

  return (
    <div {...props}>
      <Dropdown menu={{ items: menu }} trigger={['contextMenu']} disabled={role !== UserRoleEnum.ADMIN} className="w-100">
        {isSelect && order
          ? (
            <Form className="d-flex justify-content-center align-items-center p-absolute w-100">
              <Select
                showSearch
                notFoundContent={<NotFoundContent />}
                style={{ width: 400 }}
                size="large"
                placeholder={t('selectItem')}
                onSelect={(itemId: number) => {
                  const candidate = (order < 4 ? bestsellers : collections).find(({ id }) => id === itemId);
                  setSelectedItem(candidate);
                }}
                onBlur={() => setIsSelect(false)}
                filterOption={(input, option) => 
                  option?.label.props.title.toLowerCase().includes(input.toLowerCase())
                }
                options={(order < 4 ? bestsellers : collections).map(({ id, name, images }) => ({
                  label: <Button
                    className="w-100 h-100 py-0 ps-0 pe-5 d-flex justify-content-between align-items-center"
                    title={name}
                  >
                    <Image alt={name} width={100} height={100} unoptimized src={images[0].src} />
                    <span className="fs-6">{name}</span>
                  </Button>,
                  value: id,
                }))}
              />
            </Form>
          )
          : isUpload && cover
            ? (
              <ImgCrop
                rotationSlider
                showReset
                aspect={2.2/1}
                modalCancel={tCrop('modalCancel')}
                modalTitle={tCrop('modalTitle')}
                resetText={tCrop('resetText')}
                fillColor="transparent">
                <Upload
                  name="file"
                  accept="image/png,image/jpg,image/jpeg"
                  action={routes.imageUpload({ isServer: false })}
                  headers={{ Authorization: `Bearer ${token}` }}
                  onChange={(info) => {
                    const { status, response } = info.file;
                    if (status === 'done' && response) {
                      message.success(tUpload('success', { fileName: info.file.name }));
                      setUploadedImage(response?.image);
                    } else if (status === 'error') {
                      message.error(response?.message);
                    }
                  }}
                >
                  <Button className='d-none' ref={uploadRef} />
                </Upload>
              </ImgCrop>)
            : <div>{children}</div>
        }
      </Dropdown>
    </div>
  );
};
