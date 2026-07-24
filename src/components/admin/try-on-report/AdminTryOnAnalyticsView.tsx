import { useTranslation } from 'react-i18next';

import { TryOnAnalyticsCharts } from '@/components/admin/try-on-report/TryOnAnalyticsCharts';
import { TryOnAnalyticsDetailsTables } from '@/components/admin/try-on-report/TryOnAnalyticsDetailsTables';
import { TryOnAnalyticsFilters } from '@/components/admin/try-on-report/TryOnAnalyticsFilters';
import { TryOnAnalyticsSummaryStats } from '@/components/admin/try-on-report/TryOnAnalyticsSummaryStats';
import { formatPreviousPeriodRangeLabel } from '@/components/admin/sales-report/salesReportChartData';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { useTryOnAnalyticsReport } from '@/hooks/useTryOnAnalyticsReport';

type AdminTryOnAnalyticsViewProps = {
  reportState: ReturnType<typeof useTryOnAnalyticsReport>;
  lang: UserLangEnum;
};

/**
 * Представление вкладки аналитики AI-примерки для темы V1
 * @param props - состояние отчёта и язык
 * @returns JSX дашборда
 */
export const AdminTryOnAnalyticsView = ({ reportState, lang }: AdminTryOnAnalyticsViewProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.tryOn.analytics' });
  const { t: tRoot } = useTranslation('translation');

  const {
    data,
    from,
    to,
    period,
    vtoTypes,
    ignorePeriod,
    attributionWindowDays,
    attributionWindowOptions,
    setFrom,
    setTo,
    setPeriod,
    setVtoTypes,
    setIgnorePeriod,
    setAttributionWindowDays,
    chartData,
    fromParams,
    toParams,
  } = reportState;

  const showComparison = !ignorePeriod && !!data?.comparison;
  const previousPeriodRangeLabel = showComparison && from && to
    ? formatPreviousPeriodRangeLabel(from, to)
    : null;

  return (
    <>
      <TryOnAnalyticsFilters
        t={t}
        lang={lang}
        from={from}
        to={to}
        fromParams={fromParams}
        toParams={toParams}
        vtoTypes={vtoTypes}
        ignorePeriod={ignorePeriod}
        attributionWindowDays={attributionWindowDays}
        attributionWindowOptions={attributionWindowOptions}
        setFrom={setFrom}
        setTo={setTo}
        setVtoTypes={setVtoTypes}
        setIgnorePeriod={setIgnorePeriod}
        setAttributionWindowDays={setAttributionWindowDays}
      />

      {data && (
        <>
          {previousPeriodRangeLabel && (
            <p className="text-muted mb-3">
              {t('comparison.previousPeriodLabel', { range: previousPeriodRangeLabel })}
            </p>
          )}

          <TryOnAnalyticsSummaryStats
            summary={data.summary}
            conversion={data.conversion}
            changesPercent={data.comparison?.changesPercent}
            showComparison={showComparison}
            t={t}
            variant="v1"
          />

          <TryOnAnalyticsCharts
            chartData={chartData}
            period={period}
            setPeriod={setPeriod}
            statusFunnel={data.statusFunnel}
            variant="v1"
          />

          <TryOnAnalyticsDetailsTables
            topItems={data.topItems}
            byItemGroup={data.byItemGroup}
            byVtoType={data.byVtoType}
            byProvider={data.byProvider}
            validationRejections={data.validationRejections}
            conversionByItem={data.conversionByItem}
            t={t}
            tRoot={tRoot}
            variant="v1"
          />
        </>
      )}
    </>
  );
};
