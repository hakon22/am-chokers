import { useTranslation } from 'react-i18next';

import { Helmet } from '@/components/Helmet';
import { BackButton } from '@/components/BackButton';
import { useAppSelector } from '@/hooks/reduxHooks';
import { useSalesReport } from '@/hooks/useSalesReport';
import { V2AdminSalesReportView } from '@/themes/v2/components/admin/V2AdminSalesReportView';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

import styles from './V2AdminSalesReport.module.scss';

export const V2AdminSalesReport = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.sales' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const reportState = useSalesReport(tToast);

  if (!reportState.isAdmin) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Helmet title={t('title')} description={t('description')} />
      <h1 className={styles.pageTitle}>{t('title')}</h1>
      <div className={styles.controls}>
        <BackButton style={{}} />
      </div>
      <V2AdminSalesReportView reportState={reportState} lang={lang} />
    </div>
  );
};
