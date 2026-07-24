import type { TryOnAnalyticsSummaryInterface } from '@server/types/reports/try-on/try-on-analytics-summary.interface';

export type TryOnAnalyticsSummaryChangesPercentInterface = {
  [Key in keyof TryOnAnalyticsSummaryInterface]: number | null;
};

export interface TryOnAnalyticsComparisonInterface {
  /** KPI предыдущего периода */
  previousSummary: TryOnAnalyticsSummaryInterface;
  /** Процент изменения по каждой метрике */
  changesPercent: TryOnAnalyticsSummaryChangesPercentInterface;
}
