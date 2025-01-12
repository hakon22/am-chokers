export interface PromotionalQueryInterface {
  /** `id` промокода */
  id?: number;
  /** Имя промокода */
  name?: string;
  /** С удалёнными */
  withDeleted?: boolean;
  /** С истёкшими */
  withExpired?: boolean;
}
