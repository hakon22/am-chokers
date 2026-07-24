export interface TryOnTopItemInterface {
  /** Id товара */
  itemId: number;
  /** Название товара */
  itemName: string;
  /** Код группы товара для ссылки в каталог */
  itemGroupCode: string;
  /** Slug товара для ссылки в каталог */
  itemTranslateName: string;
  /** URL обложки */
  itemImageSrc: string | null;
  /** Количество примерок */
  tryOnsCount: number;
  /** Средняя длительность, мс */
  averageDurationMs: number;
  /** Затраты AI, ₽ */
  totalAiCost: number;
  /** Доля положительных оценок, % */
  positiveRatingRate: number | null;
}
