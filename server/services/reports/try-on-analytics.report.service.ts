import _ from 'lodash';
import moment from 'moment';
import { Singleton } from 'typescript-ioc';

import { AiTryOnLogEntity } from '@server/db/entities/ai/ai-try-on-log.entity';
import { OrderEntity } from '@server/db/entities/order.entity';
import { OrderPositionEntity } from '@server/db/entities/order.position.entity';
import { AcquiringTransactionEntity } from '@server/db/entities/acquiring.transaction.entity';
import { BaseService } from '@server/services/app/base.service';
import { getDateFormat } from '@server/utilities/chart-dates-generator';
import { getPositionPrice } from '@/utilities/order/getOrderPrice';
import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import { AiTryOnLogStatusEnum } from '@server/types/ai/enums/ai-try-on-log-status.enum';
import { AiTryOnUserRatingEnum } from '@server/types/ai/enums/ai-try-on-user-rating.enum';
import { AiProviderTypeEnum } from '@server/types/ai/enums/ai-provider-type.enum';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { TransactionStatusEnum } from '@server/types/acquiring/enums/transaction.status.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { TryOnAnalyticsReportQueryInterface } from '@server/types/reports/try-on/try-on-analytics-report-query.interface';
import type { TryOnAnalyticsReportInterface } from '@server/types/reports/try-on/try-on-analytics-report.interface';
import type { TryOnAnalyticsSummaryInterface } from '@server/types/reports/try-on/try-on-analytics-summary.interface';
import type { TryOnAnalyticsComparisonInterface } from '@server/types/reports/try-on/try-on-analytics-comparison.interface';
import type { TryOnAnalyticsSummaryChangesPercentInterface } from '@server/types/reports/try-on/try-on-analytics-comparison.interface';
import type { TryOnChartDataPointInterface } from '@server/types/reports/try-on/try-on-chart-data-point.interface';
import type { TryOnConversionSummaryInterface } from '@server/types/reports/try-on/try-on-conversion-summary.interface';
import type { TryOnConversionByItemInterface } from '@server/types/reports/try-on/try-on-conversion-by-item.interface';
import type { OrderInterface } from '@/types/order/Order';

const TOP_ITEMS_LIMIT = 10;
const TOP_GROUPS_LIMIT = 10;
const TOP_PROVIDERS_LIMIT = 10;
const TOP_REJECTIONS_LIMIT = 10;
const TOP_CONVERSION_ITEMS_LIMIT = 10;
const DEFAULT_ATTRIBUTION_WINDOW_DAYS = 7;

type TryOnReportAggregationResult = Omit<TryOnAnalyticsReportInterface, 'comparison'>;

type ConversionAttributionRow = {
  tryOnLogId: number;
  itemId: number;
  userId: number;
  totalCost: number | null;
  positionPrice: number;
  positionDiscount: number;
  positionDiscountPrice: number;
  positionCount: number;
};

type ConversionAttributionRawRow = {
  tryOnLogId: string | number;
  itemId: string | number;
  userId: string | number;
  totalCost: string | number | null;
  positionPrice: string | number;
  positionDiscount: string | number;
  positionDiscountPrice: string | number;
  positionCount: string | number;
};

@Singleton
export class TryOnAnalyticsReportService extends BaseService {
  /**
   * Загружает логи AI-примерки за период с товаром и группой
   * @param query - параметры отчёта
   * @returns массив логов
   */
  private fetchLogs = async (query: TryOnAnalyticsReportQueryInterface): Promise<AiTryOnLogEntity[]> => {
    const manager = this.databaseService.getManager();
    const builder = manager.createQueryBuilder(AiTryOnLogEntity, 'log')
      .select([
        'log.id',
        'log.created',
        'log.status',
        'log.vtoType',
        'log.durationMs',
        'log.totalCost',
        'log.validationCost',
        'log.generationCost',
        'log.userRating',
        'log.validationReason',
        'log.generationProvider',
      ])
      .leftJoin('log.user', 'user')
      .addSelect('user.id')
      .leftJoin('log.item', 'item')
      .addSelect([
        'item.id',
        'item.translateName',
      ])
      .leftJoin('item.group', 'itemGroup')
      .addSelect([
        'itemGroup.id',
        'itemGroup.code',
      ])
      .leftJoin('item.translations', 'itemTranslations')
      .addSelect([
        'itemTranslations.lang',
        'itemTranslations.name',
      ])
      .leftJoin('itemGroup.translations', 'groupTranslations')
      .addSelect([
        'groupTranslations.lang',
        'groupTranslations.name',
      ])
      .leftJoin('item.images', 'itemImages', 'itemImages.deleted IS NULL')
      .addSelect([
        'itemImages.id',
        'itemImages.name',
        'itemImages.path',
        'itemImages.order',
      ]);

    if (!query.ignorePeriod && query.from && query.to) {
      const from = moment(query.from).startOf('day').toISOString(true);
      const to = moment(query.to).endOf('day').toISOString(true);
      builder.andWhere('"log"."created" BETWEEN :from AND :to', { from, to });
    }

    if (!_.isEmpty(query.vtoTypes)) {
      builder.andWhere('"log"."vto_type" IN (:...vtoTypes)', { vtoTypes: query.vtoTypes });
    }

    return builder
      .orderBy('log.id', 'DESC')
      .addOrderBy('itemImages.order', 'ASC')
      .getMany();
  };

  /**
   * Возвращает локализованное имя товара
   * @param log - лог с загруженным товаром
   * @param lang - язык отчёта
   * @returns название товара
   */
  private getItemName = (log: AiTryOnLogEntity, lang: UserLangEnum): string => {
    const { item } = log;
    if (_.isNil(item)) {
      return '—';
    }
    return item.translations?.find((translation) => translation.lang === lang)?.name
      || item.translations?.[0]?.name
      || item.translateName;
  };

  /**
   * Возвращает локализованное имя группы товаров
   * @param log - лог с загруженной группой
   * @param lang - язык отчёта
   * @returns название группы
   */
  private getItemGroupName = (log: AiTryOnLogEntity, lang: UserLangEnum): string => {
    const { group } = log.item ?? {};
    if (_.isNil(group)) {
      return '—';
    }
    return group.translations?.find((translation) => translation.lang === lang)?.name
      || group.translations?.[0]?.name
      || group.code;
  };

  /**
   * Возвращает URL обложки товара
   * @param log - лог с изображениями товара
   * @returns путь к файлу или null
   */
  private getItemCoverImageSrc = (log: AiTryOnLogEntity): string | null => {
    const sortedImages = [...(log.item?.images ?? [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const firstImage = sortedImages[0];

    if (_.isNil(firstImage)) {
      return null;
    }

    return firstImage.src ?? [firstImage.path, firstImage.name].join('/').replaceAll('\\', '/');
  };

  /**
   * Агрегирует KPI, графики и таблицы из логов
   * @param logs - логи за период
   * @param lang - язык пользователя
   * @param query - параметры отчёта
   * @returns агрегированные данные без comparison
   */
  private buildReportFromLogs = async (
    logs: AiTryOnLogEntity[],
    lang: UserLangEnum,
    query: TryOnAnalyticsReportQueryInterface,
  ): Promise<TryOnReportAggregationResult> => {
    const totalRequestsCount = logs.length;
    const {
      successfulLogs,
      validationRejectedCount,
      generationFailedCount,
    } = logs.reduce<{
      successfulLogs: AiTryOnLogEntity[];
      validationRejectedCount: number;
      generationFailedCount: number;
    }>((acc, log) => {
      const { status } = log;

      if (status === AiTryOnLogStatusEnum.SUCCESS) {
        acc.successfulLogs.push(log);
      }

      if (status === AiTryOnLogStatusEnum.VALIDATION_REJECTED) {
        acc.validationRejectedCount += 1;
      }

      if (
        status === AiTryOnLogStatusEnum.GENERATION_FAILED
        || status === AiTryOnLogStatusEnum.PROVIDER_ERROR
      ) {
        acc.generationFailedCount += 1;
      }

      return acc;
    }, {
      successfulLogs: [],
      validationRejectedCount: 0,
      generationFailedCount: 0,
    });
    const successfulTryOnsCount = successfulLogs.length;

    const successRate = totalRequestsCount
      ? +((successfulTryOnsCount / totalRequestsCount) * 100).toFixed(2)
      : 0;

    const durationValues = successfulLogs
      .map(({ durationMs }) => durationMs)
      .filter((durationMs) => !_.isNil(durationMs));
    const averageDurationMs = durationValues.length
      ? Math.round(_.sum(durationValues) / durationValues.length)
      : 0;

    const totalAiCost = +_.sum(logs.map((log) => log.totalCost ?? 0)).toFixed(2);
    const successCosts = successfulLogs.map((log) => log.totalCost ?? 0);
    const averageSuccessCost = successCosts.length
      ? +(_.sum(successCosts) / successCosts.length).toFixed(2)
      : 0;

    const ratedLogs = successfulLogs.filter((log) => !_.isNil(log.userRating));
    const ratingsCount = ratedLogs.length;
    const goodRatingsCount = ratedLogs.filter((log) => log.userRating === AiTryOnUserRatingEnum.GOOD).length;
    const positiveRatingRate = ratingsCount
      ? +((goodRatingsCount / ratingsCount) * 100).toFixed(2)
      : 0;

    const chartDataByPeriod: Record<ChartPeriodEnum, Record<string, TryOnChartDataPointInterface>> = {
      [ChartPeriodEnum.DAY]: {},
      [ChartPeriodEnum.WEEK]: {},
      [ChartPeriodEnum.MONTH]: {},
    };

    const statusCounts: Partial<Record<AiTryOnLogStatusEnum, number>> = {};
    const topItemsMap: Record<number, {
      itemId: number;
      itemName: string;
      itemGroupCode: string;
      itemTranslateName: string;
      itemImageSrc: string | null;
      tryOnsCount: number;
      durationSum: number;
      durationCount: number;
      totalAiCost: number;
      goodRatings: number;
      ratingsCount: number;
    }> = {};
    const itemGroupMap: Record<number, {
      groupId: number;
      groupName: string;
      groupCode: string;
      tryOnsCount: number;
      totalAiCost: number;
      ratingsCount: number;
    }> = {};
    const vtoTypeMap: Record<string, number> = {};
    const providerMap: Record<string, {
      provider: AiProviderTypeEnum;
      count: number;
      costSum: number;
      durationSum: number;
      durationCount: number;
    }> = {};
    const rejectionMap: Record<string, number> = {};

    logs.forEach((log) => {
      statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;

      Object.values(ChartPeriodEnum).forEach((period) => {
        const formattedDate = moment(log.created).format(getDateFormat(period));
        if (!chartDataByPeriod[period][formattedDate]) {
          chartDataByPeriod[period][formattedDate] = {
            date: formattedDate,
            tryOnsCount: 0,
            aiCost: 0,
          };
        }
        const chartPoint = chartDataByPeriod[period][formattedDate];
        chartPoint.tryOnsCount += 1;
        chartPoint.aiCost = +(chartPoint.aiCost + (log.totalCost ?? 0)).toFixed(2);
      });

      vtoTypeMap[log.vtoType] = (vtoTypeMap[log.vtoType] || 0) + 1;

      if (log.status === AiTryOnLogStatusEnum.VALIDATION_REJECTED && !_.isEmpty(log.validationReason)) {
        const reason = log.validationReason as string;
        rejectionMap[reason] = (rejectionMap[reason] || 0) + 1;
      }

      if (!_.isNil(log.generationProvider)) {
        if (!providerMap[log.generationProvider]) {
          providerMap[log.generationProvider] = {
            provider: log.generationProvider,
            count: 0,
            costSum: 0,
            durationSum: 0,
            durationCount: 0,
          };
        }
        const providerEntry = providerMap[log.generationProvider];
        providerEntry.count += 1;
        providerEntry.costSum += log.totalCost ?? 0;
        if (!_.isNil(log.durationMs)) {
          providerEntry.durationSum += log.durationMs;
          providerEntry.durationCount += 1;
        }
      }

      if (log.status !== AiTryOnLogStatusEnum.SUCCESS || _.isNil(log.item?.id)) {
        return;
      }

      const { item } = log;
      const itemId = item.id;

      if (!topItemsMap[itemId]) {
        topItemsMap[itemId] = {
          itemId,
          itemName: this.getItemName(log, lang),
          itemGroupCode: item.group?.code ?? '',
          itemTranslateName: item.translateName ?? '',
          itemImageSrc: this.getItemCoverImageSrc(log),
          tryOnsCount: 0,
          durationSum: 0,
          durationCount: 0,
          totalAiCost: 0,
          goodRatings: 0,
          ratingsCount: 0,
        };
      }
      const topItemEntry = topItemsMap[itemId];
      topItemEntry.tryOnsCount += 1;
      topItemEntry.totalAiCost = +(topItemEntry.totalAiCost + (log.totalCost ?? 0)).toFixed(2);
      if (!_.isNil(log.durationMs)) {
        topItemEntry.durationSum += log.durationMs;
        topItemEntry.durationCount += 1;
      }
      if (!_.isNil(log.userRating)) {
        topItemEntry.ratingsCount += 1;
        if (log.userRating === AiTryOnUserRatingEnum.GOOD) {
          topItemEntry.goodRatings += 1;
        }
      }

      const { group } = item;
      if (!_.isNil(group?.id)) {
        if (!itemGroupMap[group.id]) {
          itemGroupMap[group.id] = {
            groupId: group.id,
            groupName: this.getItemGroupName(log, lang),
            groupCode: group.code ?? '',
            tryOnsCount: 0,
            totalAiCost: 0,
            ratingsCount: 0,
          };
        }
        const groupEntry = itemGroupMap[group.id];
        groupEntry.tryOnsCount += 1;
        groupEntry.totalAiCost = +(groupEntry.totalAiCost + (log.totalCost ?? 0)).toFixed(2);
        if (!_.isNil(log.userRating)) {
          groupEntry.ratingsCount += 1;
        }
      }
    });

    const chartData = Object.values(ChartPeriodEnum).reduce((accumulator, period) => {
      const sortedDates = Object.keys(chartDataByPeriod[period]).sort((dateA, dateB) => (
        moment(dateA, getDateFormat(period)).valueOf() - moment(dateB, getDateFormat(period)).valueOf()
      ));
      accumulator[period] = sortedDates.map((date) => chartDataByPeriod[period][date]);
      return accumulator;
    }, {
      [ChartPeriodEnum.DAY]: [],
      [ChartPeriodEnum.WEEK]: [],
      [ChartPeriodEnum.MONTH]: [],
    } as TryOnAnalyticsReportInterface['chartData']);

    const statusFunnel = Object.values(AiTryOnLogStatusEnum).map((status) => ({
      status,
      count: statusCounts[status] || 0,
    }));

    const topItems = Object.values(topItemsMap)
      .map((entry) => ({
        itemId: entry.itemId,
        itemName: entry.itemName,
        itemGroupCode: entry.itemGroupCode,
        itemTranslateName: entry.itemTranslateName,
        itemImageSrc: entry.itemImageSrc,
        tryOnsCount: entry.tryOnsCount,
        averageDurationMs: entry.durationCount
          ? Math.round(entry.durationSum / entry.durationCount)
          : 0,
        totalAiCost: entry.totalAiCost,
        positiveRatingRate: entry.ratingsCount
          ? +((entry.goodRatings / entry.ratingsCount) * 100).toFixed(2)
          : null,
      }))
      .sort((itemA, itemB) => itemB.tryOnsCount - itemA.tryOnsCount || itemB.totalAiCost - itemA.totalAiCost)
      .slice(0, TOP_ITEMS_LIMIT);

    const byItemGroup = Object.values(itemGroupMap)
      .map((entry) => ({
        groupId: entry.groupId,
        groupName: entry.groupName,
        groupCode: entry.groupCode,
        tryOnsCount: entry.tryOnsCount,
        totalAiCost: entry.totalAiCost,
        ratingsShare: entry.tryOnsCount
          ? +((entry.ratingsCount / entry.tryOnsCount) * 100).toFixed(2)
          : 0,
      }))
      .sort((groupA, groupB) => groupB.tryOnsCount - groupA.tryOnsCount || groupB.totalAiCost - groupA.totalAiCost)
      .slice(0, TOP_GROUPS_LIMIT);

    const byVtoType = Object.entries(vtoTypeMap)
      .map(([vtoType, count]) => ({
        vtoType: vtoType as TryOnAnalyticsReportInterface['byVtoType'][number]['vtoType'],
        count,
        sharePercent: totalRequestsCount
          ? +((count / totalRequestsCount) * 100).toFixed(2)
          : 0,
      }))
      .sort((typeA, typeB) => typeB.count - typeA.count);

    const byProvider = Object.values(providerMap)
      .map((entry) => ({
        provider: entry.provider,
        count: entry.count,
        averageCost: entry.count
          ? +(entry.costSum / entry.count).toFixed(2)
          : 0,
        averageDurationMs: entry.durationCount
          ? Math.round(entry.durationSum / entry.durationCount)
          : 0,
      }))
      .sort((providerA, providerB) => providerB.count - providerA.count)
      .slice(0, TOP_PROVIDERS_LIMIT);

    const validationRejections = Object.entries(rejectionMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((rejectionA, rejectionB) => rejectionB.count - rejectionA.count)
      .slice(0, TOP_REJECTIONS_LIMIT);

    const { conversion, conversionByItem } = await this.buildConversionMetrics(logs, lang, query);

    return {
      summary: {
        totalRequestsCount,
        successfulTryOnsCount,
        successRate,
        validationRejectedCount,
        generationFailedCount,
        averageDurationMs,
        totalAiCost,
        averageSuccessCost,
        ratingsCount,
        positiveRatingRate,
      },
      chartData,
      statusFunnel,
      topItems,
      byItemGroup,
      byVtoType,
      byProvider,
      validationRejections,
      conversion,
      conversionByItem,
    };
  };

  /**
   * Загружает атрибутированные конверсии try-on → покупка
   * @param query - параметры отчёта
   * @param attributionWindowDays - окно в днях
   * @returns строки атрибуции
   */
  private fetchConversionAttributions = async (
    query: TryOnAnalyticsReportQueryInterface,
    attributionWindowDays: number,
  ): Promise<ConversionAttributionRow[]> => {
    const manager = this.databaseService.getManager();
    const builder = manager.createQueryBuilder(AiTryOnLogEntity, 'log')
      .setParameters({
        canceledStatus: OrderStatusEnum.CANCELED,
        attributionWindowDays,
        paidStatus: TransactionStatusEnum.PAID,
        successStatus: AiTryOnLogStatusEnum.SUCCESS,
      })
      .select('"log"."id"', 'tryOnLogId')
      .addSelect('"log"."item_id"', 'itemId')
      .addSelect('"log"."user_id"', 'userId')
      .addSelect('"log"."total_cost"', 'totalCost')
      .addSelect('"positions"."price"', 'positionPrice')
      .addSelect('"positions"."discount"', 'positionDiscount')
      .addSelect('"positions"."discount_price"', 'positionDiscountPrice')
      .addSelect('"positions"."count"', 'positionCount')
      .innerJoin(
        OrderEntity,
        'purchaseOrder',
        `"purchaseOrder"."user_id" = "log"."user_id"
          AND "purchaseOrder"."created" > "log"."created"
          AND "purchaseOrder"."created" <= "log"."created" + make_interval(days => :attributionWindowDays)
          AND "purchaseOrder"."deleted" IS NULL
          AND "purchaseOrder"."status" <> :canceledStatus`,
      )
      .innerJoin(
        OrderPositionEntity,
        'positions',
        '"positions"."order_id" = "purchaseOrder"."id" AND "positions"."item_id" = "log"."item_id" AND "positions"."deleted" IS NULL',
      )
      .innerJoin(
        AcquiringTransactionEntity,
        'transaction',
        '"transaction"."order_id" = "purchaseOrder"."id" AND "transaction"."status" = :paidStatus',
      )
      .where('"log"."status" = :successStatus')
      .andWhere('"log"."user_id" IS NOT NULL');

    if (!query.ignorePeriod && query.from && query.to) {
      const from = moment(query.from).startOf('day').toISOString(true);
      const to = moment(query.to).endOf('day').toISOString(true);
      builder.andWhere('"log"."created" BETWEEN :from AND :to', { from, to });
    }

    if (!_.isEmpty(query.vtoTypes)) {
      builder.andWhere('"log"."vto_type" IN (:...vtoTypes)', { vtoTypes: query.vtoTypes });
    }

    builder.orderBy('"log"."id"', 'ASC').addOrderBy('"purchaseOrder"."created"', 'ASC');

    const rawRows = await builder.getRawMany<ConversionAttributionRawRow>();

    return rawRows.map(this.mapConversionAttributionRow);
  };

  /**
   * Приводит строку raw-запроса атрибуции к типизированным числам
   * @param row - строка из getRawMany (transformer entity на raw не действует)
   * @returns нормализованная строка атрибуции
   */
  private mapConversionAttributionRow = (row: ConversionAttributionRawRow): ConversionAttributionRow => {
    const { tryOnLogId, itemId, userId, totalCost, positionPrice, positionDiscount, positionDiscountPrice, positionCount } = row;

    return {
      tryOnLogId: +tryOnLogId,
      itemId: +itemId,
      userId: +userId,
      totalCost: _.isNil(totalCost) ? null : +totalCost,
      positionPrice: +positionPrice,
      positionDiscount: +positionDiscount,
      positionDiscountPrice: +positionDiscountPrice,
      positionCount: +positionCount,
    };
  };

  /**
   * Строит метрики конверсии примерка → покупка
   * @param logs - логи за период
   * @param lang - язык отчёта
   * @param query - параметры отчёта
   * @returns summary и таблица по товарам
   */
  private buildConversionMetrics = async (
    logs: AiTryOnLogEntity[],
    lang: UserLangEnum,
    query: TryOnAnalyticsReportQueryInterface,
  ): Promise<{
    conversion: TryOnConversionSummaryInterface;
    conversionByItem: TryOnConversionByItemInterface[];
  }> => {
    const attributionWindowDays = query.attributionWindowDays ?? DEFAULT_ATTRIBUTION_WINDOW_DAYS;
    const eligibleLogs = logs.filter((log) => (
      log.status === AiTryOnLogStatusEnum.SUCCESS && !_.isNil(log.user?.id)
    ));
    const eligibleTryOnsCount = eligibleLogs.length;

    const attributionRows = await this.fetchConversionAttributions(query, attributionWindowDays);
    const firstTouchRows = _.uniqBy(attributionRows, 'tryOnLogId');

    const convertedTryOnIds = new Set(firstTouchRows.map(({ tryOnLogId }) => tryOnLogId));
    const convertedTryOnsCount = convertedTryOnIds.size;
    const uniqueBuyersAfterTryOn = new Set(firstTouchRows.map(({ userId }) => userId).filter(Boolean));

    let attributedRevenue = 0;
    let attributedAiCost = 0;

    firstTouchRows.forEach(({ positionPrice, positionDiscount, positionDiscountPrice, positionCount, totalCost }) => {
      attributedRevenue += getPositionPrice({
        price: positionPrice,
        discount: positionDiscount,
        discountPrice: positionDiscountPrice,
        count: positionCount,
      } as OrderInterface['positions'][number]);
      attributedAiCost += totalCost ?? 0;
    });

    attributedRevenue = +attributedRevenue.toFixed(2);
    attributedAiCost = +attributedAiCost.toFixed(2);

    const tryOnToPurchaseRate = eligibleTryOnsCount
      ? +((convertedTryOnsCount / eligibleTryOnsCount) * 100).toFixed(2)
      : 0;

    const returnOnAiSpend = attributedAiCost
      ? +(attributedRevenue / attributedAiCost).toFixed(2)
      : null;

    const eligibleByItem = eligibleLogs.reduce<Record<number, { log: AiTryOnLogEntity; eligibleCount: number; aiCost: number; }>>((acc, log) => {
      const itemId = log.item?.id;
      if (_.isNil(itemId)) {
        return acc;
      }
      if (!acc[itemId]) {
        acc[itemId] = {
          log,
          eligibleCount: 0,
          aiCost: 0,
        };
      }
      acc[itemId].eligibleCount += 1;
      acc[itemId].aiCost = +(acc[itemId].aiCost + (log.totalCost ?? 0)).toFixed(2);
      return acc;
    }, {});

    const conversionByItemMap: Record<number, {
      itemId: number;
      itemName: string;
      itemGroupCode: string;
      itemTranslateName: string;
      itemImageSrc: string | null;
      eligibleTryOnsCount: number;
      convertedCount: number;
      attributedRevenue: number;
      attributedAiCost: number;
    }> = {};

    Object.entries(eligibleByItem).forEach(([itemIdKey, entry]) => {
      const itemId = +itemIdKey;
      conversionByItemMap[itemId] = {
        itemId,
        itemName: this.getItemName(entry.log, lang),
        itemGroupCode: entry.log.item?.group?.code ?? '',
        itemTranslateName: entry.log.item?.translateName ?? '',
        itemImageSrc: this.getItemCoverImageSrc(entry.log),
        eligibleTryOnsCount: entry.eligibleCount,
        convertedCount: 0,
        attributedRevenue: 0,
        attributedAiCost: 0,
      };
    });

    firstTouchRows.forEach((row) => {
      if (!conversionByItemMap[row.itemId]) {
        return;
      }
      const itemEntry = conversionByItemMap[row.itemId];
      itemEntry.convertedCount += 1;
      itemEntry.attributedRevenue = +(itemEntry.attributedRevenue + getPositionPrice({
        price: row.positionPrice,
        discount: row.positionDiscount,
        discountPrice: row.positionDiscountPrice,
        count: row.positionCount,
      } as OrderInterface['positions'][number])).toFixed(2);
      itemEntry.attributedAiCost = +(itemEntry.attributedAiCost + (row.totalCost ?? 0)).toFixed(2);
    });

    const conversionByItem = Object.values(conversionByItemMap)
      .map((entry) => ({
        ...entry,
        conversionRate: entry.eligibleTryOnsCount
          ? +((entry.convertedCount / entry.eligibleTryOnsCount) * 100).toFixed(2)
          : 0,
        returnOnAiSpend: entry.attributedAiCost
          ? +(entry.attributedRevenue / entry.attributedAiCost).toFixed(2)
          : null,
      }))
      .filter(({ eligibleTryOnsCount }) => eligibleTryOnsCount)
      .sort((a, b) => b.convertedCount - a.convertedCount || b.attributedRevenue - a.attributedRevenue)
      .slice(0, TOP_CONVERSION_ITEMS_LIMIT);

    return {
      conversion: {
        eligibleTryOnsCount,
        convertedTryOnsCount,
        tryOnToPurchaseRate,
        uniqueBuyersAfterTryOnCount: uniqueBuyersAfterTryOn.size,
        attributedRevenue,
        attributedAiCost,
        returnOnAiSpend,
      },
      conversionByItem,
    };
  };

  /**
   * Рассчитывает процент изменения метрики
   * @param currentValue - значение текущего периода
   * @param previousValue - значение предыдущего периода
   * @returns процент изменения или null
   */
  private calculateChangePercent = (currentValue: number, previousValue: number): number | null => {
    if (previousValue === 0) {
      return currentValue === 0 ? 0 : null;
    }
    return +(((currentValue - previousValue) / previousValue) * 100).toFixed(1);
  };

  /**
   * Формирует блок сравнения KPI с предыдущим периодом
   * @param currentSummary - KPI текущего периода
   * @param previousSummary - KPI предыдущего периода
   * @returns сравнение с процентами изменения
   */
  private buildComparison = (
    currentSummary: TryOnAnalyticsSummaryInterface,
    previousSummary: TryOnAnalyticsSummaryInterface,
  ): TryOnAnalyticsComparisonInterface => {
    const summaryKeys = Object.keys(currentSummary) as (keyof TryOnAnalyticsSummaryInterface)[];

    const changesPercent = summaryKeys.reduce((acc, key) => {
      acc[key] = this.calculateChangePercent(currentSummary[key], previousSummary[key]);
      return acc;
    }, {} as TryOnAnalyticsSummaryChangesPercentInterface);

    return {
      previousSummary,
      changesPercent,
    };
  };

  /**
   * Формирует дашборд AI-примерки за указанный период
   * @param lang - язык пользователя
   * @param query - параметры отчёта
   * @returns агрегированные KPI, графики и конверсия
   */
  public tryOnAnalyticsReport = async (
    lang: UserLangEnum,
    query?: TryOnAnalyticsReportQueryInterface,
  ): Promise<TryOnAnalyticsReportInterface> => {
    const ignorePeriod = query?.ignorePeriod;

    if (!ignorePeriod && (!query?.from || !query?.to)) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Укажите период отчёта'
        : 'Specify the reporting period');
    }

    this.loggerService.info('Try-on analytics report requested', {
      ignorePeriod,
      from: query?.from,
      to: query?.to,
      vtoTypes: query?.vtoTypes,
      attributionWindowDays: query?.attributionWindowDays ?? DEFAULT_ATTRIBUTION_WINDOW_DAYS,
    });

    const logs = await this.fetchLogs(query || {});
    const currentReport = await this.buildReportFromLogs(logs, lang, query || {});

    if (ignorePeriod) {
      return {
        ...currentReport,
        comparison: null,
      };
    }

    const periodDays = moment(query?.to).diff(moment(query?.from), 'days') + 1;
    const previousTo = moment(query?.from).subtract(1, 'day').format('YYYY-MM-DD');
    const previousFrom = moment(previousTo).subtract(periodDays - 1, 'days').format('YYYY-MM-DD');

    const previousLogs = await this.fetchLogs({
      ...query,
      from: previousFrom,
      to: previousTo,
      ignorePeriod: false,
    });
    const previousReport = await this.buildReportFromLogs(previousLogs, lang, {
      ...query,
      from: previousFrom,
      to: previousTo,
      ignorePeriod: false,
    });

    const comparison = this.buildComparison(currentReport.summary, previousReport.summary);

    return {
      ...currentReport,
      comparison,
    };
  };
}
