import { Singleton } from 'typescript-ioc';
import moment from 'moment';

import { YandexDirectStatisticsEntity } from '@server/db/entities/yandex.direct.statistics.entity';
import { BaseService } from '@server/services/app/base.service';
import { chartDatesGenerate, getDateFormat } from '@server/utilities/chart-dates-generator';
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
      allDates: {
        [ChartPeriodEnum.DAY]: chartDatesGenerate(query, ChartPeriodEnum.DAY),
        [ChartPeriodEnum.WEEK]: chartDatesGenerate(query, ChartPeriodEnum.WEEK),
        [ChartPeriodEnum.MONTH]: chartDatesGenerate(query, ChartPeriodEnum.MONTH),
      },
      chartData: {
        [ChartPeriodEnum.DAY]: [],
        [ChartPeriodEnum.WEEK]: [],
        [ChartPeriodEnum.MONTH]: [],
      },
      campaignStats: {},
      totalStats: {
        totalClicks: 0,
        totalCost: 0,
      },
    };

    const chartDataByPeriod: Record<ChartPeriodEnum, Record<string, ChartDataPointInterface>> = {
      [ChartPeriodEnum.DAY]: {},
      [ChartPeriodEnum.WEEK]: {},
      [ChartPeriodEnum.MONTH]: {},
    };

    statistics.forEach(({ date, clicks, cost, campaign }) => {
      const dateObj = moment(date);

      result.totalStats.totalClicks += clicks;
      result.totalStats.totalCost = +(result.totalStats.totalCost + cost).toFixed(2);

      if (campaign && campaign.id) {
        if (!result.campaignStats[campaign.id]) {
          result.campaignStats[campaign.id] = {
            name: campaign.name,
            totalClicks: 0,
            totalCost: 0,
            color: campaign.name === 'Телеграм' ? ['#4193dbff', '#094375ff'] : ['#e4b96d', '#ac771cff'],
            visible: true,
          };
        }
        result.campaignStats[campaign.id].totalClicks += clicks;
        result.campaignStats[campaign.id].totalCost = +(result.campaignStats[campaign.id].totalCost + cost).toFixed(2);
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
            },
          };
        }

        const chartPoint = chartDataByPeriod[period][formattedDate];

        chartPoint.total.clicks += clicks;
        chartPoint.total.cost = +(chartPoint.total.cost + cost).toFixed(2);

        if (campaign && campaign.id) {
          if (!chartPoint.campaigns[campaign.id]) {
            chartPoint.campaigns[campaign.id] = {
              clicks: 0,
              cost: 0,
            };
          }
          chartPoint.campaigns[campaign.id].clicks += clicks;
          chartPoint.campaigns[campaign.id].cost = +(chartPoint.campaigns[campaign.id].cost + cost).toFixed(2);
        }
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
