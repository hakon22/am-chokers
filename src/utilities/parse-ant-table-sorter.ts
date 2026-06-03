import { isNil } from 'lodash';
import type { SortOrder, SorterResult } from 'antd/es/table/interface';

import type { TableSortOrderType, TableSortQueryInterface } from '@/types/table/table-sort.interface';

type SortFieldMapping = Record<string, string>;

/**
 * Преобразует sortOrder Ant Design Table в значение API
 * @param order - направление из Ant Design Table
 * @returns ASC/DESC или undefined при сбросе
 */
export const mapAntSortOrderToApi = (order?: SortOrder): TableSortOrderType | undefined => {
  if (order === 'ascend') {
    return 'ASC';
  }
  if (order === 'descend') {
    return 'DESC';
  }
  return undefined;
};

/**
 * Преобразует sortOrder API в значение Ant Design Table
 * @param sortOrder - направление из API
 * @returns ascend/descend или null
 */
export const mapApiSortOrderToAnt = (sortOrder?: TableSortOrderType): SortOrder | null => {
  if (sortOrder === 'ASC') {
    return 'ascend';
  }
  if (sortOrder === 'DESC') {
    return 'descend';
  }
  return null;
};

/**
 * Извлекает sortField/sortOrder из Ant Design Table onChange для серверного запроса
 * @param sorter - результат sorter из Table.onChange
 * @param sortFieldMapping - маппинг dataIndex колонки → API sortField
 * @returns query-параметры сортировки или пустой объект при сбросе
 */
export const parseAntTableSorter = <RecordType>(
  sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  sortFieldMapping?: SortFieldMapping,
): TableSortQueryInterface => {
  const activeSorter = Array.isArray(sorter) ? sorter.find(({ order }) => !isNil(order)) ?? sorter[0] : sorter;
  const { field, order } = activeSorter;
  const sortOrder = mapAntSortOrderToApi(order);

  if (isNil(sortOrder)) {
    return {};
  }

  const fieldKey = Array.isArray(field) ? field.join('.') : String(field ?? '');
  const sortField = sortFieldMapping?.[fieldKey] ?? fieldKey;

  return {
    sortField,
    sortOrder,
  };
};

/**
 * Возвращает controlled sortOrder для колонки Ant Design Table
 * @param columnField - dataIndex колонки
 * @param sortField - текущее поле сортировки из state (API)
 * @param sortOrder - текущее направление из state (API)
 * @param sortFieldMapping - маппинг dataIndex → API sortField
 * @returns sortOrder для Table.Column или null
 */
export const getAntTableColumnSortOrder = (
  columnField: string,
  sortField?: string,
  sortOrder?: TableSortOrderType,
  sortFieldMapping?: SortFieldMapping,
): SortOrder | null => {
  const apiSortField = sortFieldMapping?.[columnField] ?? columnField;

  if (sortField !== apiSortField || isNil(sortOrder)) {
    return null;
  }

  return mapApiSortOrderToAnt(sortOrder);
};
