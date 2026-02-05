export interface BannerQueryInterface {
  /** С удалёнными */
  withDeleted?: boolean;
  /** Исключить `ids` */
  excludeIds?: number[];
  /** Включить только эти `ids` */
  includeIds?: number[];
}
