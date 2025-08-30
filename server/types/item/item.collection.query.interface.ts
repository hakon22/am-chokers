export interface ItemCollectionQueryInterface {
  /** `id` коллекции */
  id?: number;
  /** Имена коллекции */
  names?: string[];
  /** С удалёнными */
  withDeleted?: boolean;
  /** Исключить `ids` */
  excludeIds?: number[];
}
