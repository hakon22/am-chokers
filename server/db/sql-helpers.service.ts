import { Singleton } from 'typescript-ioc';
import { QueryBuilder, type ObjectLiteral } from 'typeorm';

import { TableSortOrderEnum } from '@server/types/table/table-sort-order.enum';

@Singleton
export abstract class SqlHelpersService {
  /**
   * Преобразует sortOrder из query в направление SQL ORDER BY
   * @param sortOrder - направление сортировки из query-параметра
   * @returns направление для TypeORM orderBy
   */
  public getSqlSortDirection = (sortOrder?: TableSortOrderEnum): 'ASC' | 'DESC' =>
    sortOrder === TableSortOrderEnum.ASC ? 'ASC' : 'DESC';

  /**
   * Проверяет, подключена ли связь с указанным alias в query builder
   * @param builder - TypeORM query builder
   * @param alias - имя alias join
   * @returns true, если join с alias уже есть
   */
  public hasJoin = (builder: QueryBuilder<ObjectLiteral>, alias: string): boolean => {
    if (builder instanceof QueryBuilder) {
      return (builder.expressionMap.joinAttributes || [])
        .some((joinAttribute) => joinAttribute.alias?.name === alias);
    }

    throw new Error('Received value is not TypeORM query builder');
  };
}
