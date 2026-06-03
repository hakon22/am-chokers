import { useTranslation } from 'react-i18next';

import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { SalesReportAreaChart } from '@/components/admin/sales-report/SalesReportCharts';
import { SalesReportDistributionCharts } from '@/components/admin/sales-report/SalesReportDistributionCharts';
import { SalesReportDetailsTables } from '@/components/admin/sales-report/SalesReportDetailsTables';
import { SalesReportFilters } from '@/components/admin/sales-report/SalesReportFilters';
import { SalesReportSummaryStats } from '@/components/admin/sales-report/SalesReportSummaryStats';
import type { useSalesReport } from '@/hooks/useSalesReport';

type SalesReportViewProps = {
  reportState: ReturnType<typeof useSalesReport>;
  lang: UserLangEnum;
};

export const AdminSalesReportView = ({ reportState, lang }: SalesReportViewProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.sales' });

  const {
    data,
    from,
    to,
    period,
    deliveryTypes,
    promoFilter,
    ignorePeriod,
    setFrom,
    setTo,
    setPeriod,
    setDeliveryTypes,
    setPromoFilter,
    setIgnorePeriod,
    chartData,
    fromParams,
    toParams,
  } = reportState;

  const showComparison = !ignorePeriod && !!data?.comparison;

  return (
    <>
      <SalesReportFilters
        t={t}
        lang={lang}
        from={from}
        to={to}
        fromParams={fromParams}
        toParams={toParams}
        deliveryTypes={deliveryTypes}
        promoFilter={promoFilter}
        ignorePeriod={ignorePeriod}
        setFrom={setFrom}
        setTo={setTo}
        setDeliveryTypes={setDeliveryTypes}
        setPromoFilter={setPromoFilter}
        setIgnorePeriod={setIgnorePeriod}
      />

      {data && (
        <>
          <SalesReportSummaryStats
            summary={data.summary}
            changesPercent={data.comparison?.changesPercent}
            showComparison={showComparison}
            t={t}
          />

          <SalesReportAreaChart chartData={chartData} period={period} setPeriod={setPeriod} />

          <SalesReportDistributionCharts
            revenueByDeliveryType={data.revenueByDeliveryType}
            ordersByStatus={data.ordersByStatus}
            revenueByStatus={data.revenueByStatus}
            lang={lang}
          />

          <SalesReportDetailsTables
            topProducts={data.topProducts}
            topPromos={data.topPromos}
            revenueByItemGroup={data.revenueByItemGroup}
            t={t}
          />
        </>
      )}
    </>
  );
};
