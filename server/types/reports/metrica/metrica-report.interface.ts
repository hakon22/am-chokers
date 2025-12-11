import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import type { ChartDataPointInterface } from '@server/types/reports/metrica/chart-data-point.interface';
import type { CampaignStatsInterface } from '@server/types/reports/metrica/campaign-stats.interface';

export interface MetricaReportInterface {
  // Все даты по периодам
  allDates: Record<ChartPeriodEnum, string[]>;
  // Данные уже преобразованные для графика
  chartData: {
    [ChartPeriodEnum.DAY]: ChartDataPointInterface[];
    [ChartPeriodEnum.WEEK]: ChartDataPointInterface[];
    [ChartPeriodEnum.MONTH]: ChartDataPointInterface[];
  };
  // Статистика по кампаниям
  campaignStats: {
    [campaignId: number]: CampaignStatsInterface;
  };
  // Общая статистика
  totalStats: {
    totalClicks: number;
    totalCost: number;
  };
}
