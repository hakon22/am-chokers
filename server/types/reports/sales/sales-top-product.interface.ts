export interface SalesTopProductInterface {
  /** ID товара */
  itemId: number;
  /** Название товара на языке отчёта */
  itemName: string;
  /** URL первого медиафайла товара (фото или видео, order = 0) или null */
  itemImageSrc: string | null;
  /** Продано единиц за период */
  soldCount: number;
  /** Выручка по позициям товара, руб. */
  revenue: number;
  /** Средний рейтинг или null */
  rating: number | null;
}
