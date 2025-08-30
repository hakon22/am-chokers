export interface ColorQueryInterface {
  /** `id` цвета */
  id?: number;
  /** Имена цвета */
  names?: string[];
  /** Код цвета */
  hex?: string;
  /** С удалёнными */
  withDeleted?: boolean;
  /** Исключить `ids` */
  excludeIds?: number[];
}
