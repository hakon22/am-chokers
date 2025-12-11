import { Singleton } from 'typescript-ioc';
import moment from 'moment';

import { YandexDirectStatisticsEntity } from '@server/db/entities/yandex.direct.statistics.entity';
import { BaseService } from '@server/services/app/base.service';
import { getDateFormat } from '@server/utilities/chart-dates-generator';
import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { DatePeriodQueryInterface } from '@server/types/reports/date-period-query.interface';
import type { MetricaReportInterface } from '@server/types/reports/metrica/metrica-report.interface';
import type { ChartDataPointInterface } from '@server/types/reports/metrica/chart-data-point.interface';

@Singleton
export class MetricaReportService extends BaseService {

  private createQueryBuilder = (query?: DatePeriodQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(YandexDirectStatisticsEntity, 'statistics')
      .setParameters({
        from: moment(query?.from).startOf('day').toISOString(true),
        to: moment(query?.to).endOf('day').toISOString(true),
      })
      .select([
        'statistics.id',
        'statistics.created',
        'statistics.deleted',
        'statistics.date',
        'statistics.clicks',
        'statistics.cost',
        'statistics.failure',
      ])
      .leftJoin('statistics.campaign', 'campaign')
      .addSelect([
        'campaign.id',
        'campaign.name',
      ]);

    if (query?.from && query?.to) {
      builder.andWhere('statistics.date BETWEEN :from AND :to');
    } else if (query?.from) {
      builder.andWhere('statistics.date >= :from');
    } else if (query?.to) {
      builder.andWhere('statistics.date <= :to');
    }

    return builder;
  };

  public metricaReport = async (lang: UserLangEnum, query?: DatePeriodQueryInterface): Promise<MetricaReportInterface> => {
    if (!query?.from && !query?.to) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Укажите период отчёта'
        : 'Specify the reporting period');
    }
    const builder = this.createQueryBuilder(query)
      .orderBy('statistics.date', 'DESC');

    const statistics = await builder.getMany();

    const result: MetricaReportInterface = {
      chartData: {
        [ChartPeriodEnum.DAY]: [],
        [ChartPeriodEnum.WEEK]: [],
        [ChartPeriodEnum.MONTH]: [],
      },
      campaignStats: {},
      totalStats: {
        totalClicks: 0,
        totalCost: 0,
        totalFailure: 0,
      },
    };

    const chartDataByPeriod: Record<ChartPeriodEnum, Record<string, ChartDataPointInterface>> = {
      [ChartPeriodEnum.DAY]: {},
      [ChartPeriodEnum.WEEK]: {},
      [ChartPeriodEnum.MONTH]: {},
    };

    statistics.forEach(({ date, clicks, cost, failure, campaign }) => {
      const dateObj = moment(date);

      result.totalStats.totalClicks += clicks;
      result.totalStats.totalCost = +(result.totalStats.totalCost + cost).toFixed(2);
      result.totalStats.totalFailure += failure;

      if (campaign && campaign.id) {
        if (!result.campaignStats[campaign.id]) {
          result.campaignStats[campaign.id] = {
            name: campaign.name,
            totalClicks: 0,
            totalCost: 0,
            totalFailure: 0,
            totalFailurePercentage: 0,
            color: campaign.name === 'Телеграм' ? ['#4193dbff', '#094375ff', '#032441ff'] : ['#e4b96d', '#ac771cff', '#62430fff'],
            visible: true,
          };
        }
        result.campaignStats[campaign.id].totalClicks += clicks;
        result.campaignStats[campaign.id].totalCost = +(result.campaignStats[campaign.id].totalCost + cost).toFixed(2);
        result.campaignStats[campaign.id].totalFailure += failure;
      }

      Object.values(ChartPeriodEnum).forEach((period) => {
        const formattedDate = dateObj.format(getDateFormat(period));

        if (!chartDataByPeriod[period][formattedDate]) {
          chartDataByPeriod[period][formattedDate] = {
            date: formattedDate,
            campaigns: {},
            total: {
              clicks: 0,
              cost: 0,
              failure: 0,
              failurePercentage: 0,
            },
          };
        }

        const chartPoint = chartDataByPeriod[period][formattedDate];

        chartPoint.total.clicks += clicks;
        chartPoint.total.cost = +(chartPoint.total.cost + cost).toFixed(2);
        chartPoint.total.failure += failure;

        if (campaign && campaign.id) {
          if (!chartPoint.campaigns[campaign.id]) {
            chartPoint.campaigns[campaign.id] = {
              clicks: 0,
              cost: 0,
              failure: 0,
              failurePercentage: 0,
            };
          }
          chartPoint.campaigns[campaign.id].clicks += clicks;
          chartPoint.campaigns[campaign.id].cost = +(chartPoint.campaigns[campaign.id].cost + cost).toFixed(2);
          chartPoint.campaigns[campaign.id].failure += failure;
        }
      });
    });

    if (result.totalStats.totalClicks > 0) {
      result.totalStats.totalFailure = +(result.totalStats.totalFailure / result.totalStats.totalClicks * 100).toFixed(2);
    }

    // Рассчитываем проценты для кампаний
    Object.keys(result.campaignStats).forEach(campaignId => {
      const campaign = result.campaignStats[+campaignId];
      if (campaign.totalClicks) {
        campaign.totalFailure = +(campaign.totalFailure / campaign.totalClicks * 100).toFixed(2);
      }
    });

    // Рассчитываем проценты для данных в графиках
    Object.values(ChartPeriodEnum).forEach((period) => {
      Object.keys(chartDataByPeriod[period]).forEach(date => {
        const chartPoint = chartDataByPeriod[period][date];

        if (chartPoint.total.clicks) {
          chartPoint.total.failurePercentage = +(chartPoint.total.failure / chartPoint.total.clicks * 100).toFixed(2);
        }

        Object.keys(chartPoint.campaigns).forEach(campaignId => {
          const campaignData = chartPoint.campaigns[+campaignId];
          if (campaignData.clicks) {
            campaignData.failurePercentage = +(campaignData.failure / campaignData.clicks * 100).toFixed(2);
          }
        });
      });
    });

    Object.values(ChartPeriodEnum).forEach((period) => {
      const sortedDates = Object.keys(chartDataByPeriod[period]).sort((a, b) => {
        return moment(a, getDateFormat(period)).valueOf() - moment(b, getDateFormat(period)).valueOf();
      });

      result.chartData[period] = sortedDates.map(date => chartDataByPeriod[period][date]);
    });

    return result;
  };
}
