import type { ChartDataPointInterface } from '@server/types/reports/metrica/chart-data-point.interface';

export type MetricaTransformedChartPoint = Record<string, string | number>;

/**
 * Оставляет в точках графика только выбранные рекламные кампании
 * @param chartData - точки графика за выбранный период группировки
 * @param selectedCampaigns - идентификаторы кампаний; пустой массив — без фильтра
 * @returns отфильтрованные точки или исходный массив
 */
export const filterChartDataByCampaigns = (chartData: ChartDataPointInterface[] | undefined, selectedCampaigns: number[]): ChartDataPointInterface[] | undefined => {
  if (!chartData?.length || !selectedCampaigns.length) {
    return chartData;
  }

  return chartData.map((point) => {
    const filteredPoint: ChartDataPointInterface = {
      date: point.date,
      campaigns: {},
      total: { clicks: 0, cost: 0, failure: 0, failurePercentage: 0 },
    };

    selectedCampaigns.forEach((campaignId) => {
      const campaignStats = point.campaigns[campaignId];
      if (campaignStats) {
        filteredPoint.campaigns[campaignId] = campaignStats;
        filteredPoint.total.clicks += campaignStats.clicks;
        filteredPoint.total.cost += campaignStats.cost;
        filteredPoint.total.failure = campaignStats.failurePercentage;
      }
    });

    return filteredPoint;
  });
};

/**
 * Преобразует точки отчёта «Метрика» в формат Recharts
 * @param chartData - точки графика после фильтрации кампаний
 * @returns массив точек для AreaChart
 */
export const transformMetricaChartData = (chartData: ChartDataPointInterface[]): MetricaTransformedChartPoint[] => (
  chartData.map((point) => {
    const transformedPoint: MetricaTransformedChartPoint = {
      date: point.date,
      totalClicks: point.total.clicks,
      totalCost: point.total.cost,
      totalFailurePercentage: point.total.failurePercentage,
    };

    Object.entries(point.campaigns).forEach(([campaignId, stats]) => {
      transformedPoint[`clicks_${campaignId}`] = stats.clicks;
      transformedPoint[`cost_${campaignId}`] = stats.cost;
      transformedPoint[`failure_${campaignId}`] = stats.failurePercentage;
    });

    return transformedPoint;
  })
);
