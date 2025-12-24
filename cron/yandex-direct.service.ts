import moment from 'moment';
import axios from 'axios';
import { Container } from 'typescript-ioc';
import _ from 'lodash';

import { LoggerService } from '@server/services/app/logger.service';
import { DatabaseService } from '@server/db/database.service';
import { YandexDirectCampaignEntity } from '@server/db/entities/yandex.direct.campaign.entity';
import { YandexDirectStatisticsEntity } from '@server/db/entities/yandex.direct.statistics.entity';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';

interface GetDailyClicksOptions {
  date?: moment.Moment;
  from?: moment.Moment | string;
  to?: moment.Moment | string;
}

interface CampaignResponseInterface {
  result: {
    Campaigns: {
      Id: number;
      Name: string;
      Type: string;
    }[];
  };
}

interface RequestReportInterface {
  params: {
    SelectionCriteria: {
      DateTo?: string;
      DateFrom?: string;
    };
    DateRangeType: 'CUSTOM_DATE' | 'YESTERDAY';
    FieldNames: ('Date' | 'CampaignId' | 'Clicks' | 'Cost' | 'Bounces')[];
    ReportName: string;
    ReportType: string;
    Format: string;
    IncludeVAT: string;
  };
}

const TAG = 'YandexDirectService';

class YandexDirectServiceCron {
  public readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private axiosInstance = axios.create({
    baseURL: 'https://api.direct.yandex.com/json',
    headers: {
      Authorization: process.env.YANDEX_DIRECT_API_KEY,
    },
  });

  private MAX_ATTEMPT = 10;

  public start = async () => {
    await this.databaseService.init();

    this.loggerService.info(TAG, 'Процесс запущен');

    const campaigns = await this.getCampaigns();

    const from = process.argv[2];
    const to = process.argv[3];

    await this.getDailyClicks(campaigns, { from, to });
  };

  private getCampaigns = async (): Promise<YandexDirectCampaignEntity[]> => {
    this.loggerService.info(TAG, 'Получаем кампании...');

    const body = {
      method: 'get',
      params: {
        SelectionCriteria: {},
        FieldNames: [
          'Id',
          'Type',
          'Name',
        ],
      },
    };

    try {
      const { data } = await this.axiosInstance.post<CampaignResponseInterface>('/v501/campaigns', body);

      this.loggerService.info(TAG, `${data.result.Campaigns.length} кампании получены`);

      const existCampaigns = await YandexDirectCampaignEntity.find();

      const newCampaigns = data.result.Campaigns.map(({ Id, Type, Name }) => YandexDirectCampaignEntity.create({
        id: existCampaigns.find(({ yandexCampaignId }) => yandexCampaignId === Id.toString())?.id,
        yandexCampaignId: Id.toString(),
        name: Name,
        type: Type,
      }));

      const campaigns = await YandexDirectCampaignEntity.save(newCampaigns);
      this.loggerService.info(TAG, 'Синхронизация кампаний завершена успешно');

      return _.uniqBy([...existCampaigns, ...campaigns], 'id');
    } catch (error: any) {
      this.loggerService.error(TAG, error.response?.data);
      throw error;
    }
  };

  private getDailyClicks = async (campaigns: YandexDirectCampaignEntity[], options?: GetDailyClicksOptions): Promise<void> => {
    const now = options?.date || moment();
    const from = options?.from || now.clone().subtract(1, 'day').format(DateFormatEnum.YYYY_MM_DD);
    const to = options?.to || now.clone().subtract(1, 'day').format(DateFormatEnum.YYYY_MM_DD);

    this.loggerService.info(TAG, `Получаем клики за период с ${from} по ${to}...`);

    const body: RequestReportInterface = {
      params: {
        SelectionCriteria: {
          ...(options?.from ? { DateFrom: moment(options.from).format(DateFormatEnum.YYYY_MM_DD) } : {}),
          ...(options?.to ? { DateTo: moment(options.to).format(DateFormatEnum.YYYY_MM_DD) } : {}),
        },
        DateRangeType: (options?.from || options?.to) ? 'CUSTOM_DATE' : 'YESTERDAY',
        FieldNames: ['Date', 'CampaignId', 'Clicks', 'Cost', 'Bounces'],
        ReportName: `Daily Clicks Report ${moment().unix()}`,
        ReportType: 'CUSTOM_REPORT',
        Format: 'TSV',
        IncludeVAT: 'NO',
      },
    };

    await this.getReport(body, campaigns);
  };

  private parseReport = (tsvData: string, campaigns: YandexDirectCampaignEntity[]): YandexDirectStatisticsEntity[] => {
    const lines = tsvData.trim().split('\n');
    const result: YandexDirectStatisticsEntity[] = [];

    const dataStartIndex = lines.findIndex(line => line.match(/^\d{4}-\d{2}-\d{2}/));

    for (let i = dataStartIndex; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line || line.startsWith('Total rows:')) {
        continue;
      }

      const [date, campaignId, clicksStr, costStr, failureStr] = line.split(/\s+/);

      const id = campaigns.find(({ yandexCampaignId }) => yandexCampaignId === campaignId)?.id;
      if (!id) {
        this.loggerService.warn(TAG, `Неизвестная компания с ID: ${campaignId}`);
        continue;
      }

      if (date && id) {
        result.push({
          date: moment(date, DateFormatEnum.YYYY_MM_DD).toDate(),
          clicks: +clicksStr || 0,
          cost: (+costStr / 1000000) || 0,
          failure: +failureStr || 0,
          campaign: { id },
        } as YandexDirectStatisticsEntity);
      }
    }

    _.uniq(result.map(({ date }) => moment(date).format(DateFormatEnum.YYYY_MM_DD))).forEach((date) => {
      const resultValues = result.filter((value) => moment(value.date).format(DateFormatEnum.YYYY_MM_DD) === date);
      if (resultValues.length !== campaigns.length) {
        const nullableCampaigns = campaigns.filter(({ id }) => !resultValues.find(({ campaign }) => campaign.id === id));
        nullableCampaigns.forEach(({ id }) => {
          result.push({
            date: moment(date, DateFormatEnum.YYYY_MM_DD).toDate(),
            clicks: 0,
            cost: 0,
            failure: 0,
            campaign: { id },
          } as YandexDirectStatisticsEntity);
        });
      }
    });

    return result;
  };

  private getReport = async (body: RequestReportInterface, campaigns: YandexDirectCampaignEntity[]) => {
    try {
      let attempt = 0;
      let finalResponse: any = null;

      const initialResponse = await this.axiosInstance.post('/v5/reports', body);

      if ([201, 202].includes(initialResponse.status)) {
        attempt = 1;
        this.loggerService.info(TAG, 'Отчёт ещё готовится, нужно подождать...');

        while (attempt <= this.MAX_ATTEMPT) {
          await new Promise((resolve) => setTimeout(resolve, 20000));
          this.loggerService.info(TAG, `Попытка получить отчёт №${attempt}...`);
          const pollResponse = await this.axiosInstance.post('/v5/reports', body);

          if (pollResponse.status === 200) {
            finalResponse = pollResponse;
            break;
          } else if ([201, 202].includes(pollResponse.status)) {
            attempt += 1;
          } else {
            const error = `Неожиданный статус: ${pollResponse.status}`;
            this.loggerService.error(TAG, error);
            throw new Error(error);
          }
        }

        if (attempt > this.MAX_ATTEMPT) {
          const error = `Превышено максимальное количество попыток (${this.MAX_ATTEMPT})`;
          this.loggerService.error(TAG, error);
          throw new Error(error);
        }

      } else if (initialResponse.status === 200) {
        finalResponse = initialResponse;
      }

      if (finalResponse && finalResponse.status === 200) {
        const toSave = this.parseReport(finalResponse.data, campaigns);

        await this.databaseService.getManager()
          .createQueryBuilder()
          .insert()
          .into(YandexDirectStatisticsEntity)
          .values(toSave)
          .orUpdate(['clicks', 'cost', 'failure'], ['date', 'campaign_id'])
          .execute();

        this.loggerService.info(TAG, `Успешно сохранено записей: ${toSave.length}`);
      }
    } catch (error: any) {
      this.loggerService.error(TAG, error.response?.data);
      throw error;
    }
  };
}

const cron = new YandexDirectServiceCron();

await cron.start().catch((e) => {
  cron.loggerService.error(TAG, e);
  process.exit(0);
});
