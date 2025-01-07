export interface OrderOptionsInterface {
  /** Только `id` заказов */
  onlyIds?: boolean;
  /** `ids` заказов */
  ids?: number[];
  /** `id` покупателя */
  userId?: number;
  /** Вместе с пользователем */
  withUser?: boolean;
  /** С удалёнными */
  withDeleted?: boolean;
}
