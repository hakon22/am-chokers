export interface SalesTopPromoInterface {
  /** Идентификатор промокода */
  promotionalId: number;
  /** Название промокода */
  name: string;
  /** Число оплаченных заказов с промокодом */
  ordersCount: number;
  /** Выручка по заказам с промокодом, руб. */
  revenue: number;
}
