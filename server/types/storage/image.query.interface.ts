export interface ImageQueryInterface {
  /** `id` изображения */
  id?: number;
  /** `id` изображений */
  ids?: number[];
  /** С удалёнными */
  withDeleted?: boolean;
  /** С товаром */
  withItem?: boolean;
}
