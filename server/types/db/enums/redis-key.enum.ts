/** Ключи Redis */
export enum RedisKeyEnum {
  /** Получение товара по `id` */
  ITEM_BY_ID = 'ITEM:',
  /** Получение группы товара по `id` */
  ITEM_GROUP_BY_ID = 'ITEM_GROUP:',
  /** Получение оценки товара по `id` */
  ITEM_GRADE_BY_ID = 'ITEM_GRADE:',
}
