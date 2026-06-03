import type { SalesReportSummaryInterface } from '@server/types/reports/sales/sales-report-summary.interface';

export type SalesReportSummaryMetricKey = keyof SalesReportSummaryInterface;

export interface SalesReportSummaryChangesPercentInterface {
  /** Процент изменения выручки относительно предыдущего периода */
  totalRevenue: number | null;
  /** Процент изменения числа оплаченных заказов */
  paidOrdersCount: number | null;
  /** Процент изменения среднего чека */
  averageOrderValue: number | null;
  /** Процент изменения проданных единиц */
  itemsSoldCount: number | null;
  /** Процент изменения числа отменённых заказов */
  canceledOrdersCount: number | null;
  /** Процент изменения выручки от доставки */
  deliveryRevenue: number | null;
  /** Процент изменения выручки от товаров */
  goodsRevenue: number | null;
  /** Процент изменения числа уникальных клиентов */
  uniqueCustomersCount: number | null;
  /** Процент изменения среднего числа позиций в заказе */
  averageItemsPerOrder: number | null;
  /** Процент изменения числа заказов с промокодом */
  promoOrdersCount: number | null;
  /** Процент изменения общего числа заказов */
  totalOrdersCount: number | null;
  /** Процент изменения конверсии в оплату */
  paymentConversionRate: number | null;
}

export interface SalesReportComparisonInterface {
  /** KPI предыдущего периода той же длины */
  previousSummary: SalesReportSummaryInterface;
  /** Процент изменения KPI относительно предыдущего периода */
  changesPercent: SalesReportSummaryChangesPercentInterface;
}
