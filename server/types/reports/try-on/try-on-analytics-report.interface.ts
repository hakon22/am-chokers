import type { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import type { TryOnAnalyticsSummaryInterface } from '@server/types/reports/try-on/try-on-analytics-summary.interface';
import type { TryOnAnalyticsComparisonInterface } from '@server/types/reports/try-on/try-on-analytics-comparison.interface';
import type { TryOnChartDataPointInterface } from '@server/types/reports/try-on/try-on-chart-data-point.interface';
import type { TryOnStatusFunnelInterface } from '@server/types/reports/try-on/try-on-status-funnel.interface';
import type { TryOnTopItemInterface } from '@server/types/reports/try-on/try-on-top-item.interface';
import type { TryOnByItemGroupInterface } from '@server/types/reports/try-on/try-on-by-item-group.interface';
import type { TryOnByVtoTypeInterface } from '@server/types/reports/try-on/try-on-by-vto-type.interface';
import type { TryOnByProviderInterface } from '@server/types/reports/try-on/try-on-by-provider.interface';
import type { TryOnValidationRejectionInterface } from '@server/types/reports/try-on/try-on-validation-rejection.interface';
import type { TryOnConversionSummaryInterface } from '@server/types/reports/try-on/try-on-conversion-summary.interface';
import type { TryOnConversionByItemInterface } from '@server/types/reports/try-on/try-on-conversion-by-item.interface';

export interface TryOnAnalyticsReportInterface {
  summary: TryOnAnalyticsSummaryInterface;
  chartData: {
    [ChartPeriodEnum.DAY]: TryOnChartDataPointInterface[];
    [ChartPeriodEnum.WEEK]: TryOnChartDataPointInterface[];
    [ChartPeriodEnum.MONTH]: TryOnChartDataPointInterface[];
  };
  statusFunnel: TryOnStatusFunnelInterface[];
  topItems: TryOnTopItemInterface[];
  byItemGroup: TryOnByItemGroupInterface[];
  byVtoType: TryOnByVtoTypeInterface[];
  byProvider: TryOnByProviderInterface[];
  validationRejections: TryOnValidationRejectionInterface[];
  conversion: TryOnConversionSummaryInterface;
  conversionByItem: TryOnConversionByItemInterface[];
  /** Сравнение с предыдущим периодом; null при ignorePeriod */
  comparison: TryOnAnalyticsComparisonInterface | null;
}
