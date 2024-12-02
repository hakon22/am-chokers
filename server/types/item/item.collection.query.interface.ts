export interface ItemCollectionQueryInterface {
  /** `id` коллекции */
  id?: number;
  /** Имя коллекции */
  name?: string;
  /** С удалёнными */
  withDeleted?: boolean;
}
