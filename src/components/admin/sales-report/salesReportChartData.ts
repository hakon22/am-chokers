import type { TFunction } from 'i18next';
import moment from 'moment';

import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { SalesReportDistributionMetricEnum } from '@server/types/reports/sales/enums/sales-report-distribution-metric.enum';
import { getDeliveryTypeTranslate } from '@/utilities/order/getDeliveryTypeTranslate';
import { SALES_REPORT_PIE_COLORS } from '@/components/admin/sales-report/salesReportConstants';
import type { SalesReportInterface } from '@server/types/reports/sales/sales-report.interface';
import type { SalesChartDataPointInterface } from '@server/types/reports/sales/sales-chart-data-point.interface';
import type { SalesReportSummaryChangesPercentInterface } from '@server/types/reports/sales/sales-report-comparison.interface';

export type ComparisonChangeTone = 'positive' | 'negative' | 'neutral';

export const INVERSE_COMPARISON_METRIC_KEYS = ['canceledOrdersCount'] as const;

type InverseComparisonMetricKey = typeof INVERSE_COMPARISON_METRIC_KEYS[number];

type ChartPointTotals = {
  revenue: number;
  ordersCount: number;
};

/**
 * Суммирует выручку и заказы по точкам графика
 * @param chartPoints - точки графика за выбранный период группировки
 * @returns итоговые значения
 */
export const getChartPeriodTotals = (chartPoints: SalesChartDataPointInterface[]): ChartPointTotals => (
  chartPoints.reduce((accumulator, point) => ({
    revenue: +(accumulator.revenue + point.revenue).toFixed(2),
    ordersCount: accumulator.ordersCount + point.ordersCount,
  }), { revenue: 0, ordersCount: 0 })
);

/**
 * Преобразует данные по типам доставки для PieChart
 * @param revenueByDeliveryType - данные из отчёта
 * @param lang - язык подписей
 * @param metric - сумма или количество
 * @returns массив для recharts PieChart
 */
export const buildDeliveryPieChartData = (
  revenueByDeliveryType: SalesReportInterface['revenueByDeliveryType'],
  lang: UserLangEnum,
  metric: SalesReportDistributionMetricEnum = SalesReportDistributionMetricEnum.REVENUE,
) => revenueByDeliveryType.map((entry, index) => ({
  name: getDeliveryTypeTranslate(entry.type, lang),
  value: metric === SalesReportDistributionMetricEnum.REVENUE ? entry.revenue : entry.ordersCount,
  fill: SALES_REPORT_PIE_COLORS[index % SALES_REPORT_PIE_COLORS.length],
  type: entry.type,
}));

/**
 * Преобразует заказы по статусам для BarChart
 * @param ordersByStatus - количество заказов по статусам
 * @param revenueByStatus - выручка по статусам
 * @param tOrders - функция перевода статусов заказа
 * @param metric - сумма или количество
 * @returns массив для recharts BarChart
 */
export const buildOrdersByStatusBarChartData = (
  ordersByStatus: SalesReportInterface['ordersByStatus'],
  revenueByStatus: SalesReportInterface['revenueByStatus'],
  tOrders: TFunction<'translation', 'pages.profile.orders'>,
  metric: SalesReportDistributionMetricEnum = SalesReportDistributionMetricEnum.COUNT,
) => {
  const statusKeys = new Set([
    ...Object.keys(ordersByStatus),
    ...Object.keys(revenueByStatus),
  ]) as Set<OrderStatusEnum>;

  return Array.from(statusKeys).map((status) => ({
    status,
    name: tOrders(`statuses.${status}`),
    value: metric === SalesReportDistributionMetricEnum.REVENUE
      ? (revenueByStatus[status] || 0)
      : (ordersByStatus[status] || 0),
  }));
};

/**
 * Возвращает опции Select для фильтра типов доставки
 * @param lang - язык подписей
 * @returns массив опций Ant Design Select
 */
export const buildDeliveryTypeFilterOptions = (lang: UserLangEnum) => (
  Object.values(DeliveryTypeEnum).map((type) => ({
    value: type,
    label: getDeliveryTypeTranslate(type, lang),
  }))
);

/**
 * Форматирует процент изменения KPI для отображения
 * @param changePercent - процент изменения или null
 * @param t - функция перевода
 * @returns строка для UI или null
 */
export const formatChangePercentLabel = (
  changePercent: number | null | undefined,
  t: TFunction<'translation', 'pages.reports.sales'>,
): string | null => {
  if (changePercent === null || changePercent === undefined) {
    return t('comparison.noData');
  }
  const prefix = changePercent > 0
    ? t('comparison.increase', { value: changePercent })
    : changePercent < 0
      ? t('comparison.decrease', { value: Math.abs(changePercent) })
      : t('comparison.unchanged');
  return prefix;
};

/**
 * Возвращает диапазон предыдущего периода той же длины, что и текущий
 * @param from - начало текущего периода в формате YYYY-MM-DD
 * @param to - конец текущего периода в формате YYYY-MM-DD
 * @returns даты предыдущего периода
 */
export const getPreviousPeriodRange = (from: string, to: string) => {
  const periodDays = moment(to).diff(moment(from), 'days') + 1;
  const previousTo = moment(from).subtract(1, 'day');
  const previousFrom = moment(previousTo).subtract(periodDays - 1, 'days');

  return {
    previousFrom: previousFrom.format(DateFormatEnum.YYYY_MM_DD),
    previousTo: previousTo.format(DateFormatEnum.YYYY_MM_DD),
  };
};

/**
 * Форматирует подпись диапазона предыдущего периода для UI
 * @param from - начало текущего периода в формате YYYY-MM-DD
 * @param to - конец текущего периода в формате YYYY-MM-DD
 * @returns строка вида DD.MM.YYYY - DD.MM.YYYY
 */
export const formatPreviousPeriodRangeLabel = (from: string, to: string): string => {
  const { previousFrom, previousTo } = getPreviousPeriodRange(from, to);
  const formattedFrom = moment(previousFrom).format(DateFormatEnum.DD_MM_YYYY);
  const formattedTo = moment(previousTo).format(DateFormatEnum.DD_MM_YYYY);
  return `${formattedFrom} - ${formattedTo}`;
};

/**
 * Определяет цветовой тон процента изменения KPI с учётом смысла метрики
 * @param metricKey - ключ KPI
 * @param changePercent - процент изменения или null
 * @returns positive, negative или neutral
 */
export const getComparisonChangeTone = (
  metricKey: keyof SalesReportSummaryChangesPercentInterface,
  changePercent: number | null | undefined,
): ComparisonChangeTone => {
  if (changePercent === null || changePercent === undefined || changePercent === 0) {
    return 'neutral';
  }

  const isIncrease = changePercent > 0;
  const isInverseMetric = INVERSE_COMPARISON_METRIC_KEYS.includes(metricKey as InverseComparisonMetricKey);
  const isPositiveOutcome = isInverseMetric ? !isIncrease : isIncrease;

  return isPositiveOutcome ? 'positive' : 'negative';
};
