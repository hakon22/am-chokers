export interface ItemQueryInterface {
  /** `id` товара */
  id?: number;
  /** Имя товара */
  name?: string;
  /** С удалёнными */
  withDeleted?: boolean;
  /** `id` группы товара */
  itemGroupId?: number;
  /** `id` коллекции товара */
  itemCollectionId?: number;
}
