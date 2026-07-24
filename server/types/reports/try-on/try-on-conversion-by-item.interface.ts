export interface TryOnConversionByItemInterface {
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
  /** Примерок (eligible) */
  eligibleTryOnsCount: number;
  /** Покупок после примерки */
  convertedCount: number;
  /** Конверсия, % */
  conversionRate: number;
  /** Атрибутированная выручка, ₽ */
  attributedRevenue: number;
  /** Затраты AI, ₽ */
  attributedAiCost: number;
  /** ROI */
  returnOnAiSpend: number | null;
}
