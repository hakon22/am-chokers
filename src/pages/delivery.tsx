import { useTranslation } from 'react-i18next';
import { useContext } from 'react';

import { Helmet } from '@/components/Helmet';
import { MobileContext } from '@/components/Context';

const Delivery = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.delivery' });

  const { isMobile } = useContext(MobileContext);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '100px' : '12%' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5">{t('title')}</h1>
      <div className="d-flex flex-column">
        <p>{t('1')}</p>
        <p>{t('2')}</p>
        <p>{t('3')}</p>
        <p>{t('4')}</p>
        <p>{t('5')}</p>
        <p>{t('6')}</p>
        <p>{t('7')}</p>
        <p className="my-4 fs-5 fw-bold text-uppercase">{t('8')}</p>
        <p>{t('9')}</p>
        <p>{t('10')}</p>
      </div>
    </div>
  );
};

export default Delivery;
