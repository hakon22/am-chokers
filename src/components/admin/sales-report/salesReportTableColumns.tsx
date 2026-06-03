import { isNil } from 'lodash';
import type { TFunction } from 'i18next';
import type { ColumnsType } from 'antd/es/table';

import { SalesReportTopProductCell } from '@/components/admin/sales-report/SalesReportTopProductCell';
import type { SalesRevenueByItemGroupInterface } from '@server/types/reports/sales/sales-revenue-by-item-group.interface';
import type { SalesTopProductInterface } from '@server/types/reports/sales/sales-top-product.interface';
import type { SalesTopPromoInterface } from '@server/types/reports/sales/sales-top-promo.interface';

/**
 * Сравнивает строки для клиентской сортировки таблицы
 * @param leftValue - первое значение
 * @param rightValue - второе значение
 * @returns число для Ant Design sorter
 */
const compareTableStrings = (leftValue: string, rightValue: string): number =>
  leftValue.localeCompare(rightValue, undefined, { sensitivity: 'base' });

/**
 * Сравнивает числа для клиентской сортировки таблицы
 * @param leftValue - первое число
 * @param rightValue - второе число
 * @returns разность для сортировки
 */
const compareTableNumbers = (leftValue: number, rightValue: number): number =>
  leftValue - rightValue;

/**
 * Сравнивает nullable рейтинги (строки без рейтинга в конце)
 * @param leftRating - рейтинг первой строки
 * @param rightRating - рейтинг второй строки
 * @returns число для сортировки
 */
const compareTableNullableRatings = (leftRating: number | null, rightRating: number | null): number => {
  if (isNil(leftRating) && isNil(rightRating)) {
    return 0;
  }
  if (isNil(leftRating)) {
    return 1;
  }
  if (isNil(rightRating)) {
    return -1;
  }
  return leftRating - rightRating;
};

/**
 * Возвращает колонки таблицы топ товаров
 * @param t - функция перевода секции sales
 * @returns колонки Ant Design Table
 */
export const buildTopProductsColumns = (t: TFunction<'translation', 'pages.reports.sales'>): ColumnsType<SalesTopProductInterface> => [
  {
    title: t('table.item'),
    dataIndex: 'itemName',
    key: 'itemName',
    sorter: (productA, productB) => compareTableStrings(productA.itemName, productB.itemName),
    render: (_itemName, product) => (
      <SalesReportTopProductCell
        itemName={product.itemName}
        itemImageSrc={product.itemImageSrc}
      />
    ),
  },
  {
    title: t('table.soldCount'),
    dataIndex: 'soldCount',
    key: 'soldCount',
    sorter: (productA, productB) => compareTableNumbers(productA.soldCount, productB.soldCount),
    defaultSortOrder: 'descend',
  },
  {
    title: t('table.revenue'),
    dataIndex: 'revenue',
    key: 'revenue',
    sorter: (productA, productB) => compareTableNumbers(productA.revenue, productB.revenue),
    render: (value: number) => t('table.revenueValue', { value }),
  },
  {
    title: t('table.rating'),
    dataIndex: 'rating',
    key: 'rating',
    sorter: (productA, productB) => compareTableNullableRatings(productA.rating, productB.rating),
    render: (value: number | null) => (value ? value.toFixed(1) : '—'),
  },
];

/**
 * Возвращает колонки таблицы топ промокодов
 * @param t - функция перевода секции sales
 * @returns колонки Ant Design Table
 */
export const buildTopPromosColumns = (t: TFunction<'translation', 'pages.reports.sales'>): ColumnsType<SalesTopPromoInterface> => [
  {
    title: t('table.promoName'),
    dataIndex: 'name',
    key: 'name',
    sorter: (promoA, promoB) => compareTableStrings(promoA.name, promoB.name),
  },
  {
    title: t('table.ordersCount'),
    dataIndex: 'ordersCount',
    key: 'ordersCount',
    sorter: (promoA, promoB) => compareTableNumbers(promoA.ordersCount, promoB.ordersCount),
    defaultSortOrder: 'descend',
  },
  {
    title: t('table.revenue'),
    dataIndex: 'revenue',
    key: 'revenue',
    sorter: (promoA, promoB) => compareTableNumbers(promoA.revenue, promoB.revenue),
    render: (value: number) => t('table.revenueValue', { value }),
  },
];

/**
 * Возвращает колонки таблицы продаж по группам товаров
 * @param t - функция перевода секции sales
 * @returns колонки Ant Design Table
 */
export const buildRevenueByItemGroupColumns = (t: TFunction<'translation', 'pages.reports.sales'>): ColumnsType<SalesRevenueByItemGroupInterface> => [
  {
    title: t('table.groupName'),
    dataIndex: 'groupName',
    key: 'groupName',
    sorter: (groupA, groupB) => compareTableStrings(groupA.groupName, groupB.groupName),
  },
  {
    title: t('table.soldCount'),
    dataIndex: 'soldCount',
    key: 'soldCount',
    sorter: (groupA, groupB) => compareTableNumbers(groupA.soldCount, groupB.soldCount),
  },
  {
    title: t('table.revenue'),
    dataIndex: 'revenue',
    key: 'revenue',
    sorter: (groupA, groupB) => compareTableNumbers(groupA.revenue, groupB.revenue),
    defaultSortOrder: 'descend',
    render: (value: number) => t('table.revenueValue', { value }),
  },
];
