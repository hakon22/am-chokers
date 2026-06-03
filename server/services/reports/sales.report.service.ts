import _ from 'lodash';
import moment from 'moment';
import { Singleton } from 'typescript-ioc';

import { OrderEntity } from '@server/db/entities/order.entity';
import { BaseService } from '@server/services/app/base.service';
import { getDateFormat } from '@server/utilities/chart-dates-generator';
import { getOrderPrice, getPositionPrice } from '@/utilities/order/getOrderPrice';
import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { TransactionStatusEnum } from '@server/types/acquiring/enums/transaction.status.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { SalesReportPromoFilterEnum } from '@server/types/reports/sales/enums/sales-report-promo-filter.enum';
import type { SalesReportQueryInterface } from '@server/types/reports/sales/sales-report-query.interface';
import type { SalesReportInterface } from '@server/types/reports/sales/sales-report.interface';
import type { SalesChartDataPointInterface } from '@server/types/reports/sales/sales-chart-data-point.interface';
import type { SalesReportSummaryInterface } from '@server/types/reports/sales/sales-report-summary.interface';
import type { SalesReportComparisonInterface } from '@server/types/reports/sales/sales-report-comparison.interface';
import type { SalesReportSummaryChangesPercentInterface } from '@server/types/reports/sales/sales-report-comparison.interface';
import type { OrderInterface } from '@/types/order/Order';

const TOP_PRODUCTS_LIMIT = 10;
const TOP_PROMOS_LIMIT = 10;
const TOP_ITEM_GROUPS_LIMIT = 10;

type SalesReportAggregationResult = Omit<SalesReportInterface, 'comparison'>;

@Singleton
export class SalesReportService extends BaseService {

  /**
   * Загружает идентификаторы заказов с опциональным фильтром по дате
   * @param query - параметры отчёта
   * @returns массив заказов с id
   */
  private fetchOrderIds = async (query: SalesReportQueryInterface): Promise<{ id: number; }[]> => {
    const manager = this.databaseService.getManager();
    const builder = manager.createQueryBuilder(OrderEntity, 'order')
      .select('order.id')
      .where('order.deleted IS NULL');

    if (!query.ignorePeriod && query.from && query.to) {
      const from = moment(query.from).startOf('day').toISOString(true);
      const to = moment(query.to).endOf('day').toISOString(true);
      builder.andWhere('order.created BETWEEN :from AND :to', { from, to });
    }

    return builder
      .orderBy('order.id', 'DESC')
      .getMany();
  };

  /**
   * Загружает заказы с позициями, промо, доставкой и транзакциями для отчёта
   * @param orderIds - идентификаторы заказов
   * @returns массив заказов с relations
   */
  private fetchOrdersByIds = async (orderIds: number[]): Promise<OrderEntity[]> => {
    if (_.isEmpty(orderIds)) {
      return [];
    }

    const manager = this.databaseService.getManager();

    return manager.createQueryBuilder(OrderEntity, 'order')
      .select([
        'order.id',
        'order.created',
        'order.status',
        'order.deliveryPrice',
        'order.deleted',
      ])
      .leftJoin('order.positions', 'positions')
      .addSelect([
        'positions.id',
        'positions.price',
        'positions.discount',
        'positions.discountPrice',
        'positions.count',
      ])
      .leftJoin('positions.item', 'item')
      .addSelect([
        'item.id',
        'item.translateName',
      ])
      .leftJoin('item.translations', 'translations')
      .addSelect([
        'translations.name',
        'translations.lang',
      ])
      .leftJoin('item.group', 'itemGroup')
      .addSelect([
        'itemGroup.id',
        'itemGroup.code',
      ])
      .leftJoin('itemGroup.translations', 'groupTranslations')
      .addSelect([
        'groupTranslations.name',
        'groupTranslations.lang',
      ])
      .leftJoin('item.rating', 'rating')
      .addSelect('rating.rating')
      .leftJoin('item.images', 'images', 'images.deleted IS NULL')
      .addSelect([
        'images.id',
        'images.name',
        'images.path',
        'images.order',
      ])
      .leftJoin('order.promotional', 'promotional')
      .addSelect([
        'promotional.id',
        'promotional.name',
        'promotional.discount',
        'promotional.discountPercent',
        'promotional.freeDelivery',
        'promotional.buyTwoGetOne',
      ])
      .leftJoin('promotional.items', 'promotionalItems')
      .addSelect('promotionalItems.id')
      .leftJoin('order.delivery', 'delivery')
      .addSelect([
        'delivery.id',
        'delivery.type',
      ])
      .leftJoin('order.user', 'user')
      .addSelect('user.id')
      .leftJoin('order.transactions', 'transactions')
      .addSelect([
        'transactions.id',
        'transactions.status',
      ])
      .where('order.id IN(:...orderIds)', { orderIds })
      .orderBy('order.id', 'DESC')
      .addOrderBy('images.order', 'ASC')
      .getMany();
  };

  /**
   * Применяет фильтры доставки и промокода к списку заказов
   * @param orders - загруженные заказы
   * @param query - параметры фильтрации
   * @returns отфильтрованный массив заказов
   */
  private applyOrderFilters = (orders: OrderEntity[], query: SalesReportQueryInterface): OrderEntity[] => {
    let filteredOrders = orders;

    if (!_.isEmpty(query.deliveryTypes)) {
      filteredOrders = filteredOrders.filter(
        (order) => order.delivery?.type && query.deliveryTypes?.includes(order.delivery.type),
      );
    }

    const { promoFilter = SalesReportPromoFilterEnum.ALL } = query;

    if (promoFilter === SalesReportPromoFilterEnum.WITH) {
      filteredOrders = filteredOrders.filter((order) => !_.isNil(order.promotional?.id));
    }

    if (promoFilter === SalesReportPromoFilterEnum.WITHOUT) {
      filteredOrders = filteredOrders.filter((order) => _.isNil(order.promotional?.id));
    }

    return filteredOrders;
  };

  /**
   * Проверяет, что заказ оплачен и не отменён
   * @param order - заказ с загруженными транзакциями
   * @returns true для учёта в выручке и топ-товарах
   */
  private isQualifyingSaleOrder = (order: OrderEntity): boolean => {
    const isPayment = !!order.transactions?.find(
      (transaction) => transaction.status === TransactionStatusEnum.PAID,
    );
    return isPayment && order.status !== OrderStatusEnum.CANCELED;
  };

  /**
   * Возвращает локализованное имя группы товаров
   * @param group - группа с переводами
   * @param lang - язык отчёта
   * @returns название группы или код
   */
  private getItemGroupName = (group: OrderEntity['positions'][number]['item']['group'], lang: UserLangEnum): string => {
    if (_.isNil(group)) {
      return '—';
    }
    return group.translations?.find((translation) => translation.lang === lang)?.name
      || group.translations?.[0]?.name
      || group.code;
  };

  /**
   * Возвращает URL первого медиафайла товара (изображение или видео с минимальным order)
   * @param item - товар с загруженными изображениями
   * @returns путь к файлу или null
   */
  private getItemCoverImageSrc = (item: OrderEntity['positions'][number]['item']): string | null => {
    const sortedImages = [...(item.images ?? [])]
      .sort((imageA, imageB) => (imageA.order ?? 0) - (imageB.order ?? 0));
    const firstImage = sortedImages[0];

    if (_.isNil(firstImage)) {
      return null;
    }

    return firstImage.src ?? [firstImage.path, firstImage.name].join('/').replaceAll('\\', '/');
  };

  /**
   * Агрегирует KPI, графики и таблицы из списка заказов
   * @param orders - заказы после фильтрации
   * @param lang - язык пользователя для названий
   * @returns агрегированные данные отчёта без блока comparison
   */
  private buildReportFromOrders = (orders: OrderEntity[], lang: UserLangEnum): SalesReportAggregationResult => {
    const qualifyingOrders = orders.filter(this.isQualifyingSaleOrder);

    const ordersByStatus = orders.reduce((accumulator, order) => {
      accumulator[order.status] = (accumulator[order.status] || 0) + 1;
      return accumulator;
    }, {} as Partial<Record<OrderStatusEnum, number>>);

    const chartDataByPeriod: Record<ChartPeriodEnum, Record<string, SalesChartDataPointInterface>> = {
      [ChartPeriodEnum.DAY]: {},
      [ChartPeriodEnum.WEEK]: {},
      [ChartPeriodEnum.MONTH]: {},
    };

    let totalRevenue = 0;
    let deliveryRevenue = 0;
    let itemsSoldCount = 0;
    let promoOrdersCount = 0;
    const uniqueCustomerIds = new Set<number>();

    const topProductsMap: Record<number, {
      itemId: number;
      itemName: string;
      itemImageSrc: string | null;
      soldCount: number;
      revenue: number;
      rating: number | null;
    }> = {};

    const topPromosMap: Record<number, {
      promotionalId: number;
      name: string;
      ordersCount: number;
      revenue: number;
    }> = {};

    const itemGroupMap: Record<number, {
      groupId: number;
      groupName: string;
      soldCount: number;
      revenue: number;
    }> = {};

    const revenueByDeliveryTypeMap: Record<DeliveryTypeEnum, {
      type: DeliveryTypeEnum;
      ordersCount: number;
      revenue: number;
    }> = {} as Record<DeliveryTypeEnum, {
      type: DeliveryTypeEnum;
      ordersCount: number;
      revenue: number;
    }>;

    const revenueByStatus: Partial<Record<OrderStatusEnum, number>> = {};

    qualifyingOrders.forEach((order) => {
      const orderAsInterface = order as unknown as OrderInterface;
      const orderRevenue = getOrderPrice(orderAsInterface);
      const orderDeliveryRevenue = +(order.deliveryPrice || 0).toFixed(2);

      revenueByStatus[order.status] = +((revenueByStatus[order.status] || 0) + orderRevenue).toFixed(2);

      totalRevenue = +(totalRevenue + orderRevenue).toFixed(2);
      deliveryRevenue = +(deliveryRevenue + orderDeliveryRevenue).toFixed(2);

      if (!_.isNil(order.user?.id)) {
        uniqueCustomerIds.add(order.user.id);
      }

      if (!_.isNil(order.promotional?.id)) {
        promoOrdersCount += 1;
        const { promotional } = order;
        if (!topPromosMap[promotional.id]) {
          topPromosMap[promotional.id] = {
            promotionalId: promotional.id,
            name: promotional.name,
            ordersCount: 0,
            revenue: 0,
          };
        }
        topPromosMap[promotional.id].ordersCount += 1;
        topPromosMap[promotional.id].revenue = +(topPromosMap[promotional.id].revenue + orderRevenue).toFixed(2);
      }

      const deliveryType = order.delivery?.type;
      if (deliveryType) {
        if (!revenueByDeliveryTypeMap[deliveryType]) {
          revenueByDeliveryTypeMap[deliveryType] = {
            type: deliveryType,
            ordersCount: 0,
            revenue: 0,
          };
        }
        revenueByDeliveryTypeMap[deliveryType].ordersCount += 1;
        revenueByDeliveryTypeMap[deliveryType].revenue = +(
          revenueByDeliveryTypeMap[deliveryType].revenue + orderRevenue
        ).toFixed(2);
      }

      order.positions?.forEach((position) => {
        if (_.isNil(position.item?.id)) {
          return;
        }
        itemsSoldCount += position.count;
        const positionRevenue = getPositionPrice(position as OrderInterface['positions'][number]);
        const { item } = position;
        const itemName = item.translations?.find((translation) => translation.lang === lang)?.name
          || item.translations?.[0]?.name
          || item.translateName;

        if (!topProductsMap[item.id]) {
          topProductsMap[item.id] = {
            itemId: item.id,
            itemName,
            itemImageSrc: this.getItemCoverImageSrc(item),
            soldCount: 0,
            revenue: 0,
            rating: item.rating?.rating ?? null,
          };
        }
        topProductsMap[item.id].soldCount += position.count;
        topProductsMap[item.id].revenue = +(topProductsMap[item.id].revenue + positionRevenue).toFixed(2);

        const { group } = item;
        if (!_.isNil(group?.id)) {
          if (!itemGroupMap[group.id]) {
            itemGroupMap[group.id] = {
              groupId: group.id,
              groupName: this.getItemGroupName(group, lang),
              soldCount: 0,
              revenue: 0,
            };
          }
          itemGroupMap[group.id].soldCount += position.count;
          itemGroupMap[group.id].revenue = +(itemGroupMap[group.id].revenue + positionRevenue).toFixed(2);
        }
      });

      Object.values(ChartPeriodEnum).forEach((period) => {
        const formattedDate = moment(order.created).format(getDateFormat(period));
        if (!chartDataByPeriod[period][formattedDate]) {
          chartDataByPeriod[period][formattedDate] = {
            date: formattedDate,
            revenue: 0,
            ordersCount: 0,
          };
        }
        const chartPoint = chartDataByPeriod[period][formattedDate];
        chartPoint.revenue = +(chartPoint.revenue + orderRevenue).toFixed(2);
        chartPoint.ordersCount += 1;
      });
    });

    const paidOrdersCount = qualifyingOrders.length;
    const goodsRevenue = +(totalRevenue - deliveryRevenue).toFixed(2);
    const averageOrderValue = paidOrdersCount
      ? +(totalRevenue / paidOrdersCount).toFixed(2)
      : 0;
    const averageItemsPerOrder = paidOrdersCount
      ? +(itemsSoldCount / paidOrdersCount).toFixed(2)
      : 0;
    const totalOrdersCount = orders.length;
    const paymentConversionRate = totalOrdersCount
      ? +(paidOrdersCount / totalOrdersCount * 100).toFixed(2)
      : 0;

    const topProducts = Object.values(topProductsMap)
      .sort((productA, productB) => productB.soldCount - productA.soldCount || productB.revenue - productA.revenue)
      .slice(0, TOP_PRODUCTS_LIMIT);

    const topPromos = Object.values(topPromosMap)
      .sort((promoA, promoB) => promoB.ordersCount - promoA.ordersCount || promoB.revenue - promoA.revenue)
      .slice(0, TOP_PROMOS_LIMIT);

    const revenueByItemGroup = Object.values(itemGroupMap)
      .sort((groupA, groupB) => groupB.revenue - groupA.revenue || groupB.soldCount - groupA.soldCount)
      .slice(0, TOP_ITEM_GROUPS_LIMIT);

    const revenueByDeliveryType = Object.values(revenueByDeliveryTypeMap)
      .sort((typeA, typeB) => typeB.revenue - typeA.revenue);

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
    } as SalesReportInterface['chartData']);

    return {
      summary: {
        totalRevenue,
        paidOrdersCount,
        averageOrderValue,
        itemsSoldCount,
        canceledOrdersCount: ordersByStatus[OrderStatusEnum.CANCELED] || 0,
        deliveryRevenue,
        goodsRevenue,
        uniqueCustomersCount: uniqueCustomerIds.size,
        averageItemsPerOrder,
        promoOrdersCount,
        totalOrdersCount,
        paymentConversionRate,
      },
      chartData,
      ordersByStatus,
      revenueByStatus,
      topProducts,
      revenueByDeliveryType,
      topPromos,
      revenueByItemGroup,
    };
  };

  /**
   * Рассчитывает процент изменения метрики
   * @param currentValue - значение текущего периода
   * @param previousValue - значение предыдущего периода
   * @returns процент изменения или null если предыдущее значение равно нулю
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
  private buildComparison = (currentSummary: SalesReportSummaryInterface, previousSummary: SalesReportSummaryInterface): SalesReportComparisonInterface => {
    const summaryKeys = Object.keys(currentSummary) as (keyof SalesReportSummaryInterface)[];

    const changesPercent = summaryKeys.reduce((accumulator, key) => {
      accumulator[key] = this.calculateChangePercent(currentSummary[key], previousSummary[key]);
      return accumulator;
    }, {} as SalesReportSummaryChangesPercentInterface);

    return {
      previousSummary,
      changesPercent,
    };
  };

  /**
   * Загружает и агрегирует отчёт по заказам с учётом фильтров
   * @param query - параметры отчёта
   * @param lang - язык пользователя
   * @returns агрегированные данные без comparison
   */
  private loadReportAggregation = async (query: SalesReportQueryInterface, lang: UserLangEnum): Promise<SalesReportAggregationResult> => {
    const orderIds = await this.fetchOrderIds(query);
    const orders = await this.fetchOrdersByIds(orderIds.map(({ id }) => id));
    const filteredOrders = this.applyOrderFilters(orders, query);
    return this.buildReportFromOrders(filteredOrders, lang);
  };

  /**
   * Формирует отчёт по продажам за указанный период
   * @param lang - язык пользователя для сообщений об ошибках
   * @param query - параметры отчёта
   * @returns агрегированные KPI, график, статусы и топ товаров
   */
  public salesReport = async (lang: UserLangEnum, query?: SalesReportQueryInterface): Promise<SalesReportInterface> => {
    const ignorePeriod = query?.ignorePeriod;

    if (!ignorePeriod && (!query?.from || !query?.to)) {
      throw new Error(lang === UserLangEnum.RU
        ? 'Укажите период отчёта'
        : 'Specify the reporting period');
    }

    this.loggerService.info('Sales report requested', {
      ignorePeriod,
      from: query?.from,
      to: query?.to,
      deliveryTypes: query?.deliveryTypes,
      promoFilter: query?.promoFilter,
    });

    const currentReport = await this.loadReportAggregation(query || {}, lang);

    if (ignorePeriod) {
      return {
        ...currentReport,
        comparison: null,
      };
    }

    const periodDays = moment(query.to).diff(moment(query.from), 'days') + 1;
    const previousTo = moment(query.from).subtract(1, 'day').format('YYYY-MM-DD');
    const previousFrom = moment(previousTo).subtract(periodDays - 1, 'days').format('YYYY-MM-DD');

    const previousReport = await this.loadReportAggregation({
      ...query,
      from: previousFrom,
      to: previousTo,
      ignorePeriod: false,
    }, lang);

    const comparison = this.buildComparison(currentReport.summary, previousReport.summary);

    return {
      ...currentReport,
      comparison,
    };
  };
}
