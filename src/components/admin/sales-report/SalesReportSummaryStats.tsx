import { Statistic } from 'antd';
import type { TFunction } from 'i18next';

import { formatChangePercentLabel } from '@/components/admin/sales-report/salesReportChartData';
import type { SalesReportSummaryInterface } from '@server/types/reports/sales/sales-report-summary.interface';
import type { SalesReportSummaryChangesPercentInterface } from '@server/types/reports/sales/sales-report-comparison.interface';

type SummaryMetricConfig = {
  key: keyof SalesReportSummaryInterface;
  suffix?: string;
};

const SUMMARY_METRICS: SummaryMetricConfig[] = [
  { key: 'totalRevenue', suffix: '₽' },
  { key: 'goodsRevenue', suffix: '₽' },
  { key: 'deliveryRevenue', suffix: '₽' },
  { key: 'paidOrdersCount' },
  { key: 'averageOrderValue', suffix: '₽' },
  { key: 'itemsSoldCount' },
  { key: 'averageItemsPerOrder' },
  { key: 'uniqueCustomersCount' },
  { key: 'promoOrdersCount' },
  { key: 'totalOrdersCount' },
  { key: 'paymentConversionRate', suffix: '%' },
  { key: 'canceledOrdersCount' },
];

type SalesReportSummaryStatsProps = {
  summary: SalesReportSummaryInterface;
  changesPercent?: SalesReportSummaryChangesPercentInterface | null;
  showComparison: boolean;
  t: TFunction<'translation', 'pages.reports.sales'>;
  layoutClassName?: string;
  itemClassName?: string;
};

/**
 * Отображает KPI отчёта по продажам с опциональным сравнением с предыдущим периодом
 * @param props - summary, changesPercent и настройки layout
 * @returns блок Statistic
 */
export const SalesReportSummaryStats = ({
  summary,
  changesPercent,
  showComparison,
  t,
  layoutClassName = 'd-flex flex-wrap gap-3 mb-4',
  itemClassName,
}: SalesReportSummaryStatsProps) => (
  <div className={layoutClassName}>
    {SUMMARY_METRICS.map(({ key, suffix }) => {
      const changeLabel = showComparison && changesPercent
        ? formatChangePercentLabel(changesPercent[key], t)
        : null;

      return (
        <div key={key} className={itemClassName}>
          <Statistic
            title={t(`summary.${key}`)}
            value={summary[key]}
            suffix={suffix}
          />
          {changeLabel && (
            <small className="text-muted d-block">
              {changeLabel} {t('comparison.vsPreviousPeriod')}
            </small>
          )}
        </div>
      );
    })}
  </div>
);
