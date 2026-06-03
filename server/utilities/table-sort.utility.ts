import { TableSortOrderEnum } from '@server/types/table/table-sort-order.enum';

/**
 * Преобразует sortOrder из query в направление SQL ORDER BY
 * @param sortOrder - направление сортировки из query-параметра
 * @returns направление для TypeORM orderBy
 */
export const getSqlSortDirection = (sortOrder?: TableSortOrderEnum): 'ASC' | 'DESC' =>
  sortOrder === TableSortOrderEnum.ASC ? 'ASC' : 'DESC';
