import { useTranslation } from 'react-i18next';
import { useContext } from 'react';

import { StaticPageJsonLd } from '@/components/seo/StaticPageJsonLd';
import { MobileContext } from '@/components/Context';
import { routes } from '@/routes';

const PrivacyPolicy = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.privacyPolicy' });

  const { isMobile } = useContext(MobileContext);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '100px' : '150px' }}>
      <StaticPageJsonLd title={t('title')} description={t('description')} path={routes.page.base.privacyPolicy} />
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
        <p>{t('22')}</p>
        <ul>
          <li>{t('23')}</li>
          <li>{t('24')}</li>
          <li>{t('25')}</li>
        </ul>
        <p>{t('26')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('27')}</p>
        <p>{t('28')}</p>
        <ul>
          <li>{t('29')}</li>
          <li>{t('30')}</li>
          <li>{t('31')}</li>
        </ul>
        <p>{t('32')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('33')}</p>
        <p>{t('34')}</p>
        <p>{t('35')}</p>
        <p>{t('36')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('37')}</p>
        <p>{t('38')}</p>
        <ul>
          <li>{t('39')}</li>
          <li>{t('40')}</li>
          <li>{t('41')}</li>
        </ul>
        <p className="fs-5 fw-bold text-uppercase">{t('42')}</p>
        <p>{t('43')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('44')}</p>
        <p>{t('45')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('46')}</p>
        <p>{t('47')}</p>
        <p>{t('48')}</p>
      </div>
    </div>
  );
};

export { getShopPageServerSideProps as getServerSideProps } from '@/lib/server/get-shop-page-server-side-props';

export default PrivacyPolicy;
