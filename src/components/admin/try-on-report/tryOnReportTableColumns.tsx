import { isNil } from 'lodash';
import type { TFunction } from 'i18next';
import type { ColumnsType } from 'antd/es/table';

import { SalesReportTopProductCell } from '@/components/admin/sales-report/SalesReportTopProductCell';
import { SalesReportGroupNameCell } from '@/components/admin/sales-report/SalesReportGroupNameCell';
import { TryOnAnalyticsHintIcon } from '@/components/admin/try-on-report/TryOnAnalyticsHints';
import { formatTryOnDurationSeconds } from '@/components/admin/try-on-report/tryOnReportChartData';
import { buildCatalogGroupHrefIfValid, buildCatalogItemHrefIfValid } from '@/utilities/getHref';
import type { TryOnTopItemInterface } from '@server/types/reports/try-on/try-on-top-item.interface';
import type { TryOnByItemGroupInterface } from '@server/types/reports/try-on/try-on-by-item-group.interface';
import type { TryOnByVtoTypeInterface } from '@server/types/reports/try-on/try-on-by-vto-type.interface';
import type { TryOnByProviderInterface } from '@server/types/reports/try-on/try-on-by-provider.interface';
import type { TryOnValidationRejectionInterface } from '@server/types/reports/try-on/try-on-validation-rejection.interface';
import type { TryOnConversionByItemInterface } from '@server/types/reports/try-on/try-on-conversion-by-item.interface';

/**
 * Сравнивает строки для клиентской сортировки таблицы
 * @param a - первое значение
 * @param b - второе значение
 * @returns число для Ant Design sorter
 */
const compareTableStrings = (a: string, b: string): number => a.localeCompare(b, undefined, { sensitivity: 'base' });

/**
 * Сравнивает числа для клиентской сортировки таблицы
 * @param a - первое число
 * @param b - второе число
 * @returns разность для сортировки
 */
const compareTableNumbers = (a: number, b: number): number => a - b;

/**
 * Сравнивает nullable числа (пустые значения в конце)
 * @param a - первое значение
 * @param b - второе значение
 * @returns число для сортировки
 */
const compareTableNullableNumbers = (a: number | null, b: number | null): number => {
  if (isNil(a) && isNil(b)) {
    return 0;
  }
  if (isNil(a)) {
    return 1;
  }
  if (isNil(b)) {
    return -1;
  }
  return a - b;
};

/**
 * Заголовок колонки таблицы с иконкой подсказки
 * @param title - текст заголовка
 * @param hint - текст tooltip
 * @returns JSX заголовка
 */
const buildTableColumnTitleWithHint = (title: string, hint: string) => (
  <span className="d-inline-flex align-items-center gap-1">
    {title}
    <TryOnAnalyticsHintIcon title={hint} />
  </span>
);

/**
 * Возвращает колонки таблицы топ товаров
 * @param t - функция перевода
 * @returns колонки Ant Design Table
 */
export const buildTryOnTopItemsColumns = (
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>,
): ColumnsType<TryOnTopItemInterface> => [
  {
    title: t('table.item'),
    dataIndex: 'itemName',
    key: 'itemName',
    sorter: (a, b) => compareTableStrings(a.itemName, b.itemName),
    render: (_, item) => (
      <SalesReportTopProductCell
        itemName={item.itemName}
        itemImageSrc={item.itemImageSrc}
        href={buildCatalogItemHrefIfValid(item.itemGroupCode, item.itemTranslateName)}
      />
    ),
  },
  {
    title: t('table.tryOnsCount'),
    dataIndex: 'tryOnsCount',
    key: 'tryOnsCount',
    sorter: (a, b) => compareTableNumbers(a.tryOnsCount, b.tryOnsCount),
    defaultSortOrder: 'descend',
  },
  {
    title: t('table.averageDuration'),
    dataIndex: 'averageDurationMs',
    key: 'averageDurationMs',
    sorter: (a, b) => compareTableNumbers(a.averageDurationMs, b.averageDurationMs),
    render: (value: number) => formatTryOnDurationSeconds(value, t),
  },
  {
    title: t('table.totalAiCost'),
    dataIndex: 'totalAiCost',
    key: 'totalAiCost',
    sorter: (a, b) => compareTableNumbers(a.totalAiCost, b.totalAiCost),
    render: (value: number) => t('table.revenueValue', { value }),
  },
  {
    title: buildTableColumnTitleWithHint(t('table.positiveRatingRate'), t('table.positiveRatingRateHint')),
    dataIndex: 'positiveRatingRate',
    key: 'positiveRatingRate',
    sorter: (a, b) => compareTableNullableNumbers(a.positiveRatingRate, b.positiveRatingRate),
    render: (value: number | null) => (isNil(value) ? '—' : t('table.percentValue', { value })),
  },
];

/**
 * Возвращает колонки таблицы по группам
 * @param t - функция перевода
 * @returns колонки Ant Design Table
 */
export const buildTryOnByGroupColumns = (
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>,
): ColumnsType<TryOnByItemGroupInterface> => [
  {
    title: t('table.groupName'),
    dataIndex: 'groupName',
    key: 'groupName',
    sorter: (a, b) => compareTableStrings(a.groupName, b.groupName),
    render: (_, { groupName, groupCode }) => (
      <SalesReportGroupNameCell
        groupName={groupName}
        href={buildCatalogGroupHrefIfValid(groupCode)}
      />
    ),
  },
  {
    title: t('table.tryOnsCount'),
    dataIndex: 'tryOnsCount',
    key: 'tryOnsCount',
    sorter: (a, b) => compareTableNumbers(a.tryOnsCount, b.tryOnsCount),
    defaultSortOrder: 'descend',
  },
  {
    title: t('table.totalAiCost'),
    dataIndex: 'totalAiCost',
    key: 'totalAiCost',
    sorter: (a, b) => compareTableNumbers(a.totalAiCost, b.totalAiCost),
    render: (value: number) => t('table.revenueValue', { value }),
  },
  {
    title: buildTableColumnTitleWithHint(t('table.ratingsShare'), t('table.ratingsShareHint')),
    dataIndex: 'ratingsShare',
    key: 'ratingsShare',
    sorter: (a, b) => compareTableNumbers(a.ratingsShare, b.ratingsShare),
    render: (value: number) => t('table.percentValue', { value }),
  },
];

/**
 * Возвращает колонки таблицы по типу примерки
 * @param t - функция перевода
 * @returns колонки Ant Design Table
 */
export const buildTryOnByVtoTypeColumns = (
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>,
): ColumnsType<TryOnByVtoTypeInterface> => [
  {
    title: t('filters.vtoType'),
    dataIndex: 'vtoType',
    key: 'vtoType',
    sorter: (a, b) => compareTableStrings(a.vtoType, b.vtoType),
    render: (value: TryOnByVtoTypeInterface['vtoType']) => t(`vtoType.${value}`),
  },
  {
    title: t('table.count'),
    dataIndex: 'count',
    key: 'count',
    sorter: (a, b) => compareTableNumbers(a.count, b.count),
    defaultSortOrder: 'descend',
  },
  {
    title: buildTableColumnTitleWithHint(t('table.sharePercent'), t('table.sharePercentHint')),
    dataIndex: 'sharePercent',
    key: 'sharePercent',
    sorter: (a, b) => compareTableNumbers(a.sharePercent, b.sharePercent),
    render: (value: number) => t('table.percentValue', { value }),
  },
];

/**
 * Возвращает колонки таблицы по провайдеру
 * @param t - функция перевода
 * @returns колонки Ant Design Table
 */
export const buildTryOnByProviderColumns = (
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>,
): ColumnsType<TryOnByProviderInterface> => [
  {
    title: t('table.provider'),
    dataIndex: 'provider',
    key: 'provider',
    sorter: (a, b) => compareTableStrings(a.provider, b.provider),
  },
  {
    title: t('table.count'),
    dataIndex: 'count',
    key: 'count',
    sorter: (a, b) => compareTableNumbers(a.count, b.count),
    defaultSortOrder: 'descend',
  },
  {
    title: t('table.averageCost'),
    dataIndex: 'averageCost',
    key: 'averageCost',
    sorter: (a, b) => compareTableNumbers(a.averageCost, b.averageCost),
    render: (value: number) => t('table.revenueValue', { value }),
  },
  {
    title: t('table.averageDuration'),
    dataIndex: 'averageDurationMs',
    key: 'averageDurationMs',
    sorter: (a, b) => compareTableNumbers(a.averageDurationMs, b.averageDurationMs),
    render: (value: number) => formatTryOnDurationSeconds(value, t),
  },
];

/**
 * Возвращает колонки таблицы отказов validation
 * @param t - функция перевода
 * @returns колонки Ant Design Table
 */
export const buildTryOnRejectionsColumns = (
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>,
): ColumnsType<TryOnValidationRejectionInterface> => [
  {
    title: t('table.reason'),
    dataIndex: 'reason',
    key: 'reason',
    sorter: (a, b) => compareTableStrings(a.reason, b.reason),
  },
  {
    title: t('table.count'),
    dataIndex: 'count',
    key: 'count',
    sorter: (a, b) => compareTableNumbers(a.count, b.count),
    defaultSortOrder: 'descend',
  },
];

/**
 * Возвращает колонки таблицы конверсии по товарам
 * @param t - функция перевода
 * @returns колонки Ant Design Table
 */
export const buildTryOnConversionColumns = (
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>,
): ColumnsType<TryOnConversionByItemInterface> => [
  {
    title: t('table.item'),
    dataIndex: 'itemName',
    key: 'itemName',
    sorter: (a, b) => compareTableStrings(a.itemName, b.itemName),
    render: (_itemName, item) => (
      <SalesReportTopProductCell
        itemName={item.itemName}
        itemImageSrc={item.itemImageSrc}
        href={buildCatalogItemHrefIfValid(item.itemGroupCode, item.itemTranslateName)}
      />
    ),
  },
  {
    title: t('table.eligibleTryOnsCount'),
    dataIndex: 'eligibleTryOnsCount',
    key: 'eligibleTryOnsCount',
    sorter: (a, b) => compareTableNumbers(a.eligibleTryOnsCount, b.eligibleTryOnsCount),
  },
  {
    title: t('table.convertedCount'),
    dataIndex: 'convertedCount',
    key: 'convertedCount',
    sorter: (a, b) => compareTableNumbers(a.convertedCount, b.convertedCount),
    defaultSortOrder: 'descend',
  },
  {
    title: t('table.conversionRate'),
    dataIndex: 'conversionRate',
    key: 'conversionRate',
    sorter: (a, b) => compareTableNumbers(a.conversionRate, b.conversionRate),
    render: (value: number) => t('table.percentValue', { value }),
  },
  {
    title: t('table.attributedRevenue'),
    dataIndex: 'attributedRevenue',
    key: 'attributedRevenue',
    sorter: (a, b) => compareTableNumbers(a.attributedRevenue, b.attributedRevenue),
    render: (value: number) => t('table.revenueValue', { value }),
  },
  {
    title: t('table.totalAiCost'),
    dataIndex: 'attributedAiCost',
    key: 'attributedAiCost',
    sorter: (a, b) => compareTableNumbers(a.attributedAiCost, b.attributedAiCost),
    render: (value: number) => t('table.revenueValue', { value }),
  },
  {
    title: t('table.returnOnAiSpend'),
    dataIndex: 'returnOnAiSpend',
    key: 'returnOnAiSpend',
    sorter: (a, b) => compareTableNullableNumbers(a.returnOnAiSpend, b.returnOnAiSpend),
    render: (value: number | null) => (isNil(value) ? '—' : value),
  },
];
