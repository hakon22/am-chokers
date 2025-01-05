import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

export interface GradeQueryInterface extends Partial<PaginationQueryInterface> {
  /** `id` оценки */
  id?: number;
}
