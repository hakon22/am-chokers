export interface CompositionQueryInterface {
  /** `id` компонента */
  id?: number;
  /** Имена компонента */
  names?: string[];
  /** С удалёнными */
  withDeleted?: boolean;
  /** Исключить `ids` */
  excludeIds?: number[];
}
