export interface GradeOptionsInterface {
  /** Только `id` оценок */
  onlyIds?: boolean;
  /** Только проверенные */
  onlyChecked?: boolean;
  /** Только НЕ проверенные */
  onlyNotChecked?: boolean;
  /** `id` товара */
  itemId?: number;
  /** `id` пользователя */
  userId?: number;
  /** `ids` оценок */
  ids?: number[];
  /** Имена товара */
  itemNames?: string[];
  /** С удалёнными */
  withDeleted?: boolean;
  /** Без использования кэша */
  withoutCache?: boolean;
}
