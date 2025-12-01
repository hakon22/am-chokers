import ImgCrop from 'antd-img-crop';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

export const CropImage = ({ children }: { children: JSX.Element }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.imageCrop' });

  return (
    <ImgCrop
      rotationSlider
      showReset
      aspect={1/1.3}
      modalCancel={t('modalCancel')}
      modalTitle={t('modalTitle')}
      resetText={t('resetText')}
      fillColor="transparent"
      beforeCrop={(file) => file.type !== 'video/mp4'}
    >
      {children}
    </ImgCrop>
  );
};
