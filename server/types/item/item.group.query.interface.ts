export interface ItemGroupQueryInterface {
  /** Id группы */
  id?: number | string;
  /** Код группы */
  code?: string;
  /** С удалёнными */
  withDeleted?: boolean;
}
