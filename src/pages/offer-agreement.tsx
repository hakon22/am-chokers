import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import Link from 'next/link';

import { Helmet } from '@/components/Helmet';
import { MobileContext } from '@/components/Context';
import { routes } from '@/routes';

const OfferAgreement = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.offerAgreement' });

  const { isMobile } = useContext(MobileContext);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '100px' : '12%' }}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center fs-1 fw-bold mb-5">{t('title')}</h1>
      <div className="d-flex flex-column">
        <p>{t('1')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('2')}</p>
        <p>{t('3')}</p>
        <p>{t('4')}</p>
        <p>{t('5')}</p>
        <p>{t('6')}<Link href={routes.privacyPolicy} title={t('6.1')}>{t('6.1')}</Link>{t('6.2')}</p>
        <p>{t('7')}</p>
        <p>{t('8')}</p>
        <p>{t('9')}</p>
        <p>{t('10')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('11')}</p>
        <p>{t('12')}</p>
        <p>{t('13')}</p>
        <p>{t('14')}</p>
        <p>{t('15')}</p>
        <p>{t('16')}</p>
        <p>{t('17')}</p>
        <p>{t('18')}</p>
        <p>{t('19')}</p>
        <p>{t('20')}</p>
        <p>{t('21')}</p>
        <p>{t('22')}</p>
        <p>{t('23')}</p>
        <p>{t('24')}</p>
        <p>{t('25')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('26')}</p>
        <p>{t('27')}</p>
        <p>{t('28')}</p>
        <p>{t('29')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('30')}</p>
        <p>{t('31')}</p>
        <p>{t('32')}</p>
        <p>{t('33')}<Link href={routes.deliveryPage} title={t('34')}>{t('34')}</Link></p>
        <p>{t('35')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('36')}</p>
        <p>{t('37')}</p>
        <p>{t('38')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('39')}</p>
        <p>{t('40')}<Link href={routes.deliveryPage} title={t('34')}>{t('34')}</Link></p>
        <p>{t('41')}</p>
        <p>{t('42')}</p>
        <p>{t('43')}</p>
        <p>{t('44')}</p>
        <p>{t('45')}</p>
        <p>{t('46')}</p>
        <p>{t('47')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('48')}</p>
        <p>{t('49')}</p>
        <p>{t('50')}</p>
        <p>{t('51')}</p>
        <p>{t('52')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('53')}</p>
        <p>{t('54')}</p>
        <p>{t('55')}</p>
        <p>{t('56')}</p>
        <p>{t('57')}</p>
        <p>{t('58')}</p>
        <p>{t('59')}</p>
        <p>{t('60')}</p>
        <p>{t('61')}</p>
        <p>{t('62')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('63')}</p>
        <p>{t('64')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('65')}</p>
        <p>{t('66')}</p>
        <p>{t('67')}</p>
        <p>{t('68')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('69')}</p>
        <p>{t('70')}</p>
        <p>{t('71')}</p>
        <p>{t('72')}</p>
        <p>{t('73')}</p>
        <p className="fs-5 fw-bold text-uppercase">{t('74')}</p>
        <p>{t('75')}</p>
        <p>{t('76')}</p>
        <p>{t('77')}</p>
        <p>{t('78')}</p>
      </div>
    </div>
  );
};

export default OfferAgreement;
