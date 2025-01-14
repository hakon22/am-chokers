import { useTranslation } from 'react-i18next';

import { Helmet } from '@/components/Helmet';

const Delivery = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.delivery' });

  return (
    <div className="d-flex flex-column" style={{ marginTop: '12%' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5">{t('title')}</h1>
      <div className="d-flex flex-column">
        <p className="mb-4 fs-5 fw-bold">{t('1')}</p>
        <p>{t('2')}</p>
        <div className="mb-4">
          {t('3')}
          <br />
          {t('4')}
        </div>
        <div>
          {t('5')}
          <br />
          {t('6')}
        </div>
        <p className="my-4 fs-5 fw-bold">{t('7')}</p>
        <p className="mb-4">{t('8')}</p>
        <div>
          {t('9')}
          <br />
          {t('10')}
        </div>
      </div>
    </div>
  );
};

export default Delivery;
