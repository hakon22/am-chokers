import { useTranslation } from 'react-i18next';
import { Button, message, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { GetProp, UploadFile, UploadProps } from 'antd/lib';

import { routes } from '@/routes';
import { useAppSelector } from '@/utilities/hooks';
import { PreviewImage } from '@/components/PreviewImage';
import { CropImage } from '@/components/CropImage';
import type { ItemInterface } from '@/types/item/Item';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

interface UploadImageInterface {
  crop?: boolean;
  preview?: boolean;
  previewImage?: string;
  previewOpen?: boolean;
  filelist: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  setCommentImages: React.Dispatch<React.SetStateAction<ItemInterface['images']>>;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviewImage: React.Dispatch<React.SetStateAction<string>>;
}

export const urlToBase64 = async (url: string, setPreviewImage: React.Dispatch<React.SetStateAction<string>>, setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>, getBase64: (file: FileType) => Promise<string>) => {
  const { data } = await axios.get(url, { responseType: 'blob' });
  const base64 = await getBase64(data);
  setPreviewImage(base64);
  setPreviewOpen(true);
};

export const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export const UploadImage = ({ crop, preview, previewImage, previewOpen, filelist, setFileList, setCommentImages, setPreviewImage, setPreviewOpen }: UploadImageInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.uploadImage' });

  const { token } = useAppSelector((state) => state.user);

  return crop
    ? (
      <>
        <CropImage>
          <Upload
            name="file"
            listType="picture"
            fileList={filelist}
            accept="image/png,image/jpg,image/jpeg"
            action={routes.imageUpload({ isServer: false })}
            headers={{ Authorization: `Bearer ${token}` }}
            onPreview={async (file: UploadFile) => {
              if (!file.url && !file.preview) {
                file.preview = await getBase64(file.originFileObj as FileType);
              }
              setPreviewImage(file.url || (file.preview as string));
              setPreviewOpen(true);
            }}
            onChange={(info) => {
              setFileList(info.fileList);
              const { status, response } = info.file;
              if (status === 'done' && response) {
                message.success(t('success', { fileName: info.file.name }));
                setCommentImages((state) => [...state, response.image]);
              } else if (status === 'error') {
                message.error(response?.message);
              }
            }}
            onRemove={(file) => {
              setCommentImages((state) => state.filter((image) => image.id !== file.response?.image.id));
            }}
          >
            <Button type="primary" icon={<UploadOutlined />}>
              {t('upload')}
            </Button>
          </Upload>
        </CropImage>
        {preview && <PreviewImage previewImage={previewImage} previewOpen={previewOpen} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />}
      </>
    )
    : (
      <>
        <Upload
          name="file"
          multiple
          listType="picture"
          fileList={filelist}
          accept="image/png,image/jpg,image/jpeg"
          action={routes.imageUpload({ isServer: false })}
          headers={{ Authorization: `Bearer ${token}` }}
          onPreview={async (file: UploadFile) => {
            if (!file.url && !file.preview) {
              file.preview = await getBase64(file.originFileObj as FileType);
            }
            setPreviewImage(file.url || (file.preview as string));
            setPreviewOpen(true);
          }}
          onChange={(info) => {
            setFileList(info.fileList);
            const { status, response } = info.file;
            if (status === 'done' && response) {
              message.success(t('success', { fileName: info.file.name }));
              setCommentImages((state) => [...state, response.image]);
            } else if (status === 'error') {
              message.error(response?.message);
            }
          }}
          onRemove={(file) => {
            setCommentImages((state) => state.filter((image) => image.id !== file.response?.image.id));
          }}
        >
          <Button type="primary" icon={<UploadOutlined />}>
            {t('upload')}
          </Button>
        </Upload>
        {preview && <PreviewImage previewImage={previewImage} previewOpen={previewOpen} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />}
      </>
    );
};
