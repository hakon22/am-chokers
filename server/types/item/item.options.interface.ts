export interface ItemOptionsInterface {
  /** Только `id` товаров */
  onlyIds?: boolean;
  /** С удалёнными */
  withDeleted?: boolean;
  /** `ids` товаров */
  ids?: number[];
  /** С оценками */
  withGrades?: boolean;
}
