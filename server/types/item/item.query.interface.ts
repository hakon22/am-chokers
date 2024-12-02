export interface ItemQueryInterface {
  /** Имя товара */
  name?: string;
  /** С удалёнными */
  withDeleted?: boolean;
  /** `id` группы товара */
  itemGroupId?: number;
  /** `id` коллекции товара */
  itemCollectionId?: number;
}
