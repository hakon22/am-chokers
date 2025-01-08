import { useTranslation } from 'react-i18next';

import { Helmet } from '@/components/Helmet';

const JewelryCare = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.jewelryCare' });

  return (
    <div className="d-flex flex-column" style={{ marginTop: '12%' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5">{t('title')}</h1>
      <div className="d-flex flex-column"></div>
    </div>
  );
};

export default JewelryCare;
