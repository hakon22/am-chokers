export interface SalesReportSummaryInterface {
  /** Суммарная выручка по оплаченным заказам за период, руб. */
  totalRevenue: number;
  /** Число оплаченных заказов (без отменённых) */
  paidOrdersCount: number;
  /** Средний чек по оплаченным заказам, руб. */
  averageOrderValue: number;
  /** Продано единиц товаров в оплаченных заказах */
  itemsSoldCount: number;
  /** Число отменённых заказов за период */
  canceledOrdersCount: number;
  /** Выручка от доставки по оплаченным заказам, руб. */
  deliveryRevenue: number;
  /** Выручка от товаров (без доставки) по оплаченным заказам, руб. */
  goodsRevenue: number;
  /** Число уникальных покупателей среди оплаченных заказов */
  uniqueCustomersCount: number;
  /** Среднее число единиц товаров в оплаченном заказе */
  averageItemsPerOrder: number;
  /** Число оплаченных заказов с промокодом */
  promoOrdersCount: number;
  /** Общее число заказов за период (все статусы) */
  totalOrdersCount: number;
  /** Доля оплаченных заказов от всех заказов за период, % */
  paymentConversionRate: number;
}
