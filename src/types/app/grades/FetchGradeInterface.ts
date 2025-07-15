import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

export interface FetchGradeInterface extends PaginationQueryInterface {
  withDeleted?: boolean;
  showAccepted?: boolean;
  userId?: number;
}
