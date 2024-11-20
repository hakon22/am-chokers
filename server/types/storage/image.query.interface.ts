export interface ImageQueryInterface {
  /** Id изображения */
  id?: number | string;
  /** Id изображений */
  ids?: (number | string)[];
  /** С удалёнными */
  withDeleted?: boolean;
}
