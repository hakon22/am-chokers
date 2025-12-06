import { Image } from 'antd';

interface PreviewImageInterface {
  previewImage?: string;
  previewOpen?: boolean;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviewImage: React.Dispatch<React.SetStateAction<string>>;
}

export const PreviewImage = ({ previewImage, previewOpen, setPreviewOpen, setPreviewImage }: PreviewImageInterface) => previewImage && (
  <Image
    styles={{ root: { display: 'none' } }}
    alt={previewImage}
    preview={{
      visible: previewOpen,
      onVisibleChange: (visible) => setPreviewOpen(visible),
      afterOpenChange: (visible) => !visible && setPreviewImage(''),
    }}
    src={previewImage}
  />
);
