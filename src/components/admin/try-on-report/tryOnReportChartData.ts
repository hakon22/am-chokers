import { isNil } from 'lodash';
import type { TFunction } from 'i18next';

import type { TryOnAnalyticsSummaryChangesPercentInterface } from '@server/types/reports/try-on/try-on-analytics-comparison.interface';
import type { TryOnChartDataPointInterface } from '@server/types/reports/try-on/try-on-chart-data-point.interface';

export const TRY_ON_REPORT_TRY_ONS_COLOR = '#722ed1';
export const TRY_ON_REPORT_AI_COST_COLOR = '#13c2c2';
export const TRY_ON_REPORT_AI_COST_STROKE = '#08979c';
export const TRY_ON_REPORT_BAR_COLOR = '#722ed1';
export const TRY_ON_REPORT_PIE_COLORS = ['#722ed1', '#13c2c2', '#fa8c16', '#f5222d', '#52c41a', '#1890ff'];

export const INVERSE_TRY_ON_COMPARISON_METRIC_KEYS = [
  'validationRejectedCount',
  'generationFailedCount',
  'averageDurationMs',
  'totalAiCost',
  'averageSuccessCost',
] as const;

export type TryOnComparisonChangeTone = 'positive' | 'negative' | 'neutral';

/**
 * Суммирует запросы и затраты AI по точкам графика
 * @param chartPoints - точки графика
 * @returns итоговые значения
 */
export const getTryOnChartPeriodTotals = (chartPoints: TryOnChartDataPointInterface[]) => (
  chartPoints.reduce((acc, point) => ({
    tryOnsCount: acc.tryOnsCount + point.tryOnsCount,
    aiCost: +(acc.aiCost + point.aiCost).toFixed(2),
  }), { tryOnsCount: 0, aiCost: 0 })
);

/**
 * Форматирует процент изменения KPI для отображения
 * @param changePercent - процент изменения или null
 * @param t - функция перевода
 * @returns строка для UI или null
 */
export const formatTryOnChangePercentLabel = (
  changePercent: number | null | undefined,
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>,
): string | null => {
  if (isNil(changePercent)) {
    return t('comparison.noData');
  }
  if (changePercent > 0) {
    return t('comparison.increase', { value: changePercent });
  }
  if (changePercent < 0) {
    return t('comparison.decrease', { value: Math.abs(changePercent) });
  }
  return t('comparison.unchanged');
};

/**
 * Форматирует длительность в секундах для таблиц аналитики
 * @param durationMs - длительность в миллисекундах
 * @param t - функция перевода
 * @returns локализованная строка
 */
export const formatTryOnDurationSeconds = (
  durationMs: number,
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>,
): string => t('table.averageDurationValue', {
  seconds: (durationMs / 1000).toFixed(1),
});

/**
 * Определяет, является ли изменение метрики положительным
 * @param metricKey - ключ KPI
 * @param changePercent - процент изменения
 * @returns true если изменение благоприятное
 */
export const isTryOnComparisonChangePositive = (
  metricKey: keyof TryOnAnalyticsSummaryChangesPercentInterface,
  changePercent: number | null | undefined,
): boolean => getTryOnComparisonChangeTone(metricKey, changePercent) === 'positive';

/**
 * Определяет цветовой тон процента изменения KPI с учётом смысла метрики
 * @param metricKey - ключ KPI
 * @param changePercent - процент изменения
 * @returns тон для стилизации сравнения
 */
export const getTryOnComparisonChangeTone = (
  metricKey: keyof TryOnAnalyticsSummaryChangesPercentInterface,
  changePercent: number | null | undefined,
): TryOnComparisonChangeTone => {
  if (isNil(changePercent) || changePercent === 0) {
    return 'neutral';
  }

  const isIncrease = changePercent > 0;
  const isInverseMetric = INVERSE_TRY_ON_COMPARISON_METRIC_KEYS.includes(
    metricKey as typeof INVERSE_TRY_ON_COMPARISON_METRIC_KEYS[number],
  );
  const isPositiveOutcome = isInverseMetric ? !isIncrease : isIncrease;

  return isPositiveOutcome ? 'positive' : 'negative';
};
