export interface ColorQueryInterface {
  /** `id` цвета */
  id?: number;
  /** Имя цвета */
  name?: string;
  /** Код цвета */
  hex?: string;
  /** С удалёнными */
  withDeleted?: boolean;
}
