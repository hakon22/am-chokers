export interface SalesRevenueByItemGroupInterface {
  /** Идентификатор группы товаров */
  groupId: number;
  /** Название группы на языке отчёта */
  groupName: string;
  /** Продано единиц в группе */
  soldCount: number;
  /** Выручка по позициям группы, руб. */
  revenue: number;
}
