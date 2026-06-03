export interface SalesChartDataPointInterface {
  /** Подпись точки на оси времени */
  date: string;
  /** Выручка за период точки, руб. */
  revenue: number;
  /** Число оплаченных заказов за период точки */
  ordersCount: number;
}
