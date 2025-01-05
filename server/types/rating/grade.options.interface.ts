export interface GradeOptionsInterface {
  /** Только `id` оценок */
  onlyIds?: boolean;
  /** Только проверенные */
  onlyChecked?: boolean;
  /** Только НЕ проверенные */
  onlyNotChecked?: boolean;
  /** `id` товара */
  itemId?: number;
  /** `ids` оценок */
  ids?: number[];
  /** Имя товара */
  itemName?: string;
  /** С удалёнными */
  withDeleted?: boolean;
  /** С заказом */
  withOrder?: boolean;
}
