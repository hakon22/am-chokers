import { useTranslation } from 'react-i18next';
import { FrownOutlined  } from '@ant-design/icons';

export const NotFoundContent = ({ text }: { text?: string; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.notFoundContent' });

  return (
    <div className="d-flex flex-column justify-content-center align-items-center p-2 gap-3">
      <FrownOutlined className="fs-1" />
      <span>{text ? text : t('text')}</span>
    </div>
  );
};
