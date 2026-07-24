export interface TryOnConversionSummaryInterface {
  /** Успешные примерки авторизованных пользователей */
  eligibleTryOnsCount: number;
  /** Примерки с покупкой того же товара в окне */
  convertedTryOnsCount: number;
  /** Конверсия в покупку, % */
  tryOnToPurchaseRate: number;
  /** Уникальные покупатели после примерки */
  uniqueBuyersAfterTryOnCount: number;
  /** Атрибутированная выручка, ₽ */
  attributedRevenue: number;
  /** Затраты AI по конвертированным примеркам, ₽ */
  attributedAiCost: number;
  /** ROI: выручка / затраты AI */
  returnOnAiSpend: number | null;
}
