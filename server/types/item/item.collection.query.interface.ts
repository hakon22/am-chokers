export interface ItemCollectionQueryInterface {
  /** Id коллекции */
  id?: number;
  /** Имя коллекции */
  name?: string;
  /** С удалёнными */
  withDeleted?: boolean;
}
