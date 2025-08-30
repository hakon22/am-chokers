export interface ItemGroupQueryInterface {
  /** `id` группы */
  id?: number;
  /** Код группы */
  code?: string;
  /** С удалёнными */
  withDeleted?: boolean;
  /** Исключить `ids` */
  excludeIds?: number[];
}
