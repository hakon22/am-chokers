export interface ItemQueryInterface {
  /** Имя товара */
  name?: string;
  /** С удалёнными */
  withDeleted?: boolean;
  /** Id группы товара */
  itemGroupId?: number;
}
