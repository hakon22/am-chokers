export interface TryOnChartDataPointInterface {
  /** Метка периода на оси X */
  date: string;
  /** Количество запросов */
  tryOnsCount: number;
  /** Затраты AI, ₽ */
  aiCost: number;
}
