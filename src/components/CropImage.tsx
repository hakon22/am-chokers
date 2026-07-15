import ImgCrop, { type ImgCropProps } from 'antd-img-crop';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';
import type { RcFile } from 'antd/lib/upload';

type CropImageProps = {
  children: JSX.Element;
  /** Props модалки кропа (например zIndex поверх родительской модалки) */
  modalProps?: ImgCropProps['modalProps'];
};

/**
 * Обёртка antd-img-crop с локализованными текстами и aspect 1/1.3
 * @param props - children Upload и опциональные modalProps
 * @returns JSX ImgCrop
 */
export const CropImage = ({ children, modalProps }: CropImageProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.imageCrop' });

  return (
    <ImgCrop
      rotationSlider
      showReset
      aspect={1 / 1.3}
      modalCancel={t('modalCancel')}
      modalTitle={t('modalTitle')}
      resetText={t('resetText')}
      fillColor="transparent"
      beforeCrop={(file: RcFile) => file.type !== 'video/mp4'}
      modalProps={modalProps}
    >
      {children}
    </ImgCrop>
  );
};
