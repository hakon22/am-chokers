import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

export interface PaginationInterface extends PaginationQueryInterface {
  count: number;
}

export interface PaginationEntityInterface<T> {
  code: number;
  id: number;
  paginationParams: PaginationInterface;
  items: T[];
}

export interface PaginationSearchInterface extends PaginationQueryInterface {
  id: number;
}
