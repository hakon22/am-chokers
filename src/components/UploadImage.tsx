import { useTranslation } from 'react-i18next';
import { Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import cn from 'classnames';
import { isEmpty } from 'lodash';
import type { GetProp, UploadFile, UploadProps } from 'antd/lib';
import type { HttpRequestHeader } from 'antd/lib/upload/interface';
import type { ImgCropProps } from 'antd-img-crop';

import { routes } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { PreviewImage } from '@/components/PreviewImage';
import { CropImage } from '@/components/CropImage';
import { toast } from '@/utilities/toast';
import type { ItemInterface } from '@/types/item/Item';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

interface UploadImageInterface {
  crop?: boolean;
  preview?: boolean;
  previewImage?: string;
  previewOpen?: boolean;
  /** When set, applied to the trigger `Button` and `type` becomes `default` so host styles (e.g. v2) win over Ant primary. */
  uploadButtonClassName?: string;
  /** Кастомный URL загрузки (например try-on upload для гостей) */
  uploadAction?: string;
  /** Не отправлять Authorization, если токена нет (гостевая загрузка) */
  withoutAuth?: boolean;
  /** Максимум файлов; при 1 новая загрузка заменяет предыдущую */
  maxCount?: number;
  /** Props модалки кропа (например zIndex поверх родительской модалки) */
  cropModalProps?: ImgCropProps['modalProps'];
  /** z-index Ant Image preview загруженных файлов */
  previewZIndex?: number;
  filelist: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  setCommentImages: React.Dispatch<React.SetStateAction<ItemInterface['images']>>;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviewImage: React.Dispatch<React.SetStateAction<string>>;
}

interface UrlToBase64ParamsInterface {
  url: string;
  setPreviewImage: React.Dispatch<React.SetStateAction<string>>;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  getBase64: (file: FileType) => Promise<string>;
  setIsSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  withoutAuth?: boolean;
}

export const urlToBase64 = async ({ url, setPreviewImage, setPreviewOpen, getBase64, setIsSubmit, withoutAuth } : UrlToBase64ParamsInterface) => {
  try {
    setIsSubmit(true);
    const { data } = await axios.get(url, { responseType: 'blob', ...(withoutAuth ? { headers: { Authorization: undefined } } : {}) });
    const base64 = await getBase64(data);
    setIsSubmit(false);
    setPreviewImage(base64);
    setPreviewOpen(true);
  } catch (e) {
    console.log(e);
    setIsSubmit(false);
  }
};

export const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export const UploadImage = ({
  crop,
  preview,
  previewImage,
  previewOpen,
  uploadButtonClassName,
  uploadAction,
  withoutAuth = false,
  maxCount,
  cropModalProps,
  previewZIndex,
  filelist,
  setFileList,
  setCommentImages,
  setPreviewImage,
  setPreviewOpen,
}: UploadImageInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.uploadImage' });

  const { token } = useAppSelector((state) => state.user);

  const uploadUrl = uploadAction ?? routes.storage.image.upload({ isServer: false });
  const uploadHeaders = withoutAuth && isEmpty(token)
    ? {}
    : { Authorization: `Bearer ${token}` };
  const isSingleUpload = maxCount === 1;

  /**
   * Обновляет список загруженных изображений после успешной загрузки
   * @param image - метаданные загруженного изображения с сервера
   * @returns void
   */
  const handleUploadSuccess = (image: ItemInterface['images'][number]) => {
    if (isSingleUpload) {
      setCommentImages([image]);
      return;
    }
    setCommentImages((state) => [...state, image]);
  };

  /**
   * Удаляет изображение из списка при удалении файла из Upload
   * @param file - удаляемый файл
   * @returns void
   */
  const handleUploadRemove = (file: UploadFile) => {
    if (isSingleUpload) {
      setCommentImages([]);
      return;
    }
    setCommentImages((state) => state.filter((image) => image.id !== file.response?.image.id));
  };

  return crop
    ? (
      <>
        <CropImage modalProps={cropModalProps}>
          <Upload
            name="file"
            listType="picture"
            fileList={filelist}
            maxCount={maxCount}
            rootClassName={cn('text-center', { 'w-100': filelist.length })}
            accept="image/png,image/jpg,image/jpeg"
            action={uploadUrl}
            headers={uploadHeaders as HttpRequestHeader}
            onPreview={async (file: UploadFile) => {
              if (!file.url && !file.preview) {
                file.preview = await getBase64(file.originFileObj as FileType);
              }
              setPreviewImage(file.url || (file.preview as string));
              setPreviewOpen(true);
            }}
            onChange={(info) => {
              setFileList(isSingleUpload ? info.fileList.slice(-1) : info.fileList);
              const { status, response } = info.file;
              if (status === 'done' && response) {
                toast(t('success', { fileName: info.file.name }), 'success');
                handleUploadSuccess(response.image);
              } else if (status === 'error') {
                toast(response?.message ?? '', 'error');
              }
            }}
            onRemove={handleUploadRemove}
          >
            <Button type={uploadButtonClassName ? 'default' : 'primary'} className={uploadButtonClassName} icon={<UploadOutlined />}>
              {t('upload')}
            </Button>
          </Upload>
        </CropImage>
        {preview && (
          <PreviewImage
            previewImage={previewImage}
            previewOpen={previewOpen}
            previewZIndex={previewZIndex}
            setPreviewImage={setPreviewImage}
            setPreviewOpen={setPreviewOpen}
          />
        )}
      </>
    )
    : (
      <>
        <Upload
          name="file"
          multiple={!isSingleUpload}
          listType="picture"
          fileList={filelist}
          maxCount={maxCount}
          rootClassName={cn('text-center', { 'w-100': filelist.length })}
          accept="image/png,image/jpg,image/jpeg"
          action={routes.storage.image.upload({ isServer: false })}
          headers={{ Authorization: `Bearer ${token}` }}
          onPreview={async (file: UploadFile) => {
            if (!file.url && !file.preview) {
              file.preview = await getBase64(file.originFileObj as FileType);
            }
            setPreviewImage(file.url || (file.preview as string));
            setPreviewOpen(true);
          }}
          onChange={(info) => {
            setFileList(isSingleUpload ? info.fileList.slice(-1) : info.fileList);
            const { status, response } = info.file;
            if (status === 'done' && response) {
              toast(t('success', { fileName: info.file.name }), 'success');
              handleUploadSuccess(response.image);
            } else if (status === 'error') {
              toast(response?.message ?? '', 'error');
            }
          }}
          onRemove={handleUploadRemove}
        >
          <Button type={uploadButtonClassName ? 'default' : 'primary'} className={uploadButtonClassName} icon={<UploadOutlined />}>
            {t('upload')}
          </Button>
        </Upload>
        {preview && (
          <PreviewImage
            previewImage={previewImage}
            previewOpen={previewOpen}
            previewZIndex={previewZIndex}
            setPreviewImage={setPreviewImage}
            setPreviewOpen={setPreviewOpen}
          />
        )}
      </>
    );
};
