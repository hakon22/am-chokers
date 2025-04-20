import { useTranslation } from 'react-i18next';
import { useContext } from 'react';

import { Helmet } from '@/components/Helmet';
import { MobileContext } from '@/components/Context';

const PrivacyPolicy = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.privacyPolicy' });

  const { isMobile } = useContext(MobileContext);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '100px' : '12%' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5">{t('title')}</h1>
      <div className="d-flex flex-column">
        <p className="fs-5 fw-bold text-uppercase">{t('1')}</p>
        <p>{t('2')}</p>
        <p>{t('3')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('4')}</p>
        <p>{t('5')}</p>
        <ul>
          <li>{t('6')}</li>
          <li>{t('7')}</li>
          <li>{t('8')}</li>
          <li>{t('9')}</li>
        </ul>
        <p className="fs-5 fw-bold text-uppercase">{t('10')}</p>
        <p>{t('11')}</p>
        <ul>
          <li>{t('12')}</li>
          <li>{t('13')}</li>
          <li>{t('14')}</li>
        </ul>
        <p>{t('15')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('16')}</p>
        <p>{t('17')}</p>
        <ul>
          <li>{t('18')}</li>
          <li>{t('19')}</li>
          <li>{t('20')}</li>
        </ul>
        <p>{t('21')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('22')}</p>
        <p>{t('23')}</p>
        <ul>
          <li>{t('24')}</li>
          <li>{t('25')}</li>
          <li>{t('26')}</li>
        </ul>
        <p>{t('27')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('28')}</p>
        <p>{t('29')}</p>
        <p>{t('30')}</p>
        <p>{t('31')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('32')}</p>
        <p>{t('33')}</p>
        <ul>
          <li>{t('34')}</li>
          <li>{t('35')}</li>
          <li>{t('36')}</li>
        </ul>
        <p className="fs-5 fw-bold text-uppercase">{t('37')}</p>
        <p>{t('38')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('39')}</p>
        <p>{t('40')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('41')}</p>
        <p>{t('42')}</p>
        <p>{t('43')}</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
