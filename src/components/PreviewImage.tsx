import { Image } from 'antd';
import { isNil } from 'lodash';

interface PreviewImageInterface {
  previewImage?: string;
  previewOpen?: boolean;
  /** z-index превью (нужен поверх модалок с высоким zIndex) */
  previewZIndex?: number;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviewImage: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Скрытый Ant Design Image с управляемым fullscreen-превью
 * @param props - src превью, состояние open и сеттеры
 * @returns JSX или null, если нет previewImage
 */
export const PreviewImage = ({
  previewImage,
  previewOpen,
  previewZIndex,
  setPreviewOpen,
  setPreviewImage,
}: PreviewImageInterface) => previewImage && (
  <Image
    styles={{ root: { display: 'none' } }}
    alt={previewImage}
    preview={{
      open: previewOpen,
      ...(isNil(previewZIndex) ? {} : { zIndex: previewZIndex }),
      onOpenChange: (visible) => setPreviewOpen(visible),
      afterOpenChange: (visible) => !visible && setPreviewImage(''),
    }}
    src={previewImage}
  />
);
