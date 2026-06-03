import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import type { SalesChartDataPointInterface } from '@server/types/reports/sales/sales-chart-data-point.interface';
import type { SalesReportComparisonInterface } from '@server/types/reports/sales/sales-report-comparison.interface';
import type { SalesReportSummaryInterface } from '@server/types/reports/sales/sales-report-summary.interface';
import type { SalesRevenueByDeliveryTypeInterface } from '@server/types/reports/sales/sales-revenue-by-delivery-type.interface';
import type { SalesRevenueByItemGroupInterface } from '@server/types/reports/sales/sales-revenue-by-item-group.interface';
import type { SalesTopProductInterface } from '@server/types/reports/sales/sales-top-product.interface';
import type { SalesTopPromoInterface } from '@server/types/reports/sales/sales-top-promo.interface';

export interface SalesReportInterface {
  summary: SalesReportSummaryInterface;
  chartData: {
    [ChartPeriodEnum.DAY]: SalesChartDataPointInterface[];
    [ChartPeriodEnum.WEEK]: SalesChartDataPointInterface[];
    [ChartPeriodEnum.MONTH]: SalesChartDataPointInterface[];
  };
  ordersByStatus: Partial<Record<OrderStatusEnum, number>>;
  /** Выручка по оплаченным заказам в разрезе статуса */
  revenueByStatus: Partial<Record<OrderStatusEnum, number>>;
  topProducts: SalesTopProductInterface[];
  revenueByDeliveryType: SalesRevenueByDeliveryTypeInterface[];
  topPromos: SalesTopPromoInterface[];
  revenueByItemGroup: SalesRevenueByItemGroupInterface[];
  /** Сравнение с предыдущим периодом; null при ignorePeriod */
  comparison: SalesReportComparisonInterface | null;
}
