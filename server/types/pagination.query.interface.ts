import type { Maybe } from 'yup';

export interface PaginationQueryInterface {
  limit?: Maybe<number | undefined>;
  offset?: Maybe<number | undefined>;
}
