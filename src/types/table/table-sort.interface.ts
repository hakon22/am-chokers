export type TableSortOrderType = 'ASC' | 'DESC';

export interface TableSortQueryInterface {
  /** Поле сортировки (whitelist задаётся endpoint) */
  sortField?: string;
  /** Направление сортировки */
  sortOrder?: TableSortOrderType;
}
