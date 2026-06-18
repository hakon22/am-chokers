import { useTranslation } from 'react-i18next';
import { useContext } from 'react';

import { Helmet } from '@/components/Helmet';
import { BackButton } from '@/components/BackButton';
import { MobileContext } from '@/components/Context';
import { useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { useSalesReport } from '@/hooks/useSalesReport';
import { AdminSalesReportView } from '@/components/admin/AdminSalesReportView';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export const V1AdminSalesReport = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.sales' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { isMobile } = useContext(MobileContext);
  const lang = useUserLang();

  const reportState = useSalesReport(tToast);

  if (!reportState.isAdmin) {
    return null;
  }

  return (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('title')}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-xl-between gap-2 mb-3">
        <BackButton style={{}} />
      </div>
      <AdminSalesReportView reportState={reportState} lang={lang} />
    </div>
  );
};
