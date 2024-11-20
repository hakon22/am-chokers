export interface ItemQueryInterface {
  /** Id товара */
  id?: number | string;
  /** Имя товара */
  name?: string;
  /** С удалёнными */
  withDeleted?: boolean;
}
