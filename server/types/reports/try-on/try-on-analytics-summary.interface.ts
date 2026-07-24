export interface TryOnAnalyticsSummaryInterface {
  /** Всего запросов AI-примерки */
  totalRequestsCount: number;
  /** Успешных примерок */
  successfulTryOnsCount: number;
  /** Доля успешных, % */
  successRate: number;
  /** Отклонено на validation */
  validationRejectedCount: number;
  /** Ошибки генерации и провайдера */
  generationFailedCount: number;
  /** Средняя длительность успешных, мс */
  averageDurationMs: number;
  /** Суммарные затраты AI, ₽ */
  totalAiCost: number;
  /** Средняя стоимость успешной примерки, ₽ */
  averageSuccessCost: number;
  /** Количество оценок клиентов */
  ratingsCount: number;
  /** Доля положительных оценок, % */
  positiveRatingRate: number;
}
