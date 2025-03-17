import { useTranslation } from 'react-i18next';
import { useContext } from 'react';

import { Helmet } from '@/components/Helmet';
import { MobileContext } from '@/components/Context';

const JewelryCare = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.jewelryCare' });

  const { isMobile } = useContext(MobileContext);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '30%' : '12%' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5">{t('title')}</h1>
      <div className="d-flex flex-column text-center text-xl-start">
        <p className="mb-5">{t('1')}</p>
        <p className="fw-bold">{t('2')}</p>
        <p>{t('3')}</p>
        <p className="fw-bold">{t('4')}</p>
        <p>{t('5')}</p>
        <p className="fw-bold">{t('6')}</p>
        <p>{t('7')}</p>
        <p className="fw-bold">{t('8')}</p>
        <p className="mb-5">{t('9')}</p>
        <p>{t('10')}</p>
      </div>
    </div>
  );
};

export default JewelryCare;
