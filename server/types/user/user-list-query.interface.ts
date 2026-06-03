import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { TableSortQueryInterface } from '@server/types/table/table-sort-query.interface';
import type { UserListSortFieldEnum } from '@server/types/user/enums/user-list-sort-field.enum';

export interface UserListQueryInterface extends PaginationQueryInterface, TableSortQueryInterface {
  /** С удалёнными пользователями */
  withDeleted?: boolean;
  /** Строка поиска по имени или телефону */
  search?: string;
  /** Поле сортировки (whitelist реестра пользователей) */
  sortField?: UserListSortFieldEnum;
}
