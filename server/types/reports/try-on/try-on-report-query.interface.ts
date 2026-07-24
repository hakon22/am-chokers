import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { TableSortQueryInterface } from '@server/types/table/table-sort-query.interface';
import type { TryOnReportSortFieldEnum } from '@server/types/reports/try-on/enums/try-on-report-sort-field.enum';

export interface TryOnReportQueryInterface extends PaginationQueryInterface, TableSortQueryInterface {
  /** Поле сортировки реестра AI-примерки */
  sortField?: TryOnReportSortFieldEnum;
}
