export interface CacheItemInterface {
  postgreSql: number;
  redis: number;
}

export interface CacheInfoInterface {
  /** Товары */
  items: CacheItemInterface;
  /** Группы товаров */
  itemGroups: CacheItemInterface;
  /** Оценки товаров */
  itemGrades: CacheItemInterface;
}
