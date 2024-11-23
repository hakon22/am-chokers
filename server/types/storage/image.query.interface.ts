export interface ImageQueryInterface {
  /** Id изображения */
  id?: number;
  /** Id изображений */
  ids?: number[];
  /** С удалёнными */
  withDeleted?: boolean;
}
