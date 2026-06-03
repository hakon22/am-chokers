import type { TableSortOrderEnum } from '@server/types/table/table-sort-order.enum';

export interface TableSortQueryInterface {
  /** Поле сортировки (whitelist задаётся endpoint) */
  sortField?: string;
  /** Направление сортировки (конвенция Ant Design Table) */
  sortOrder?: TableSortOrderEnum;
}
