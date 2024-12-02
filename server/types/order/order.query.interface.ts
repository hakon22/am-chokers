export interface OrderQueryInterface {
  /** `id` заказа */
  id?: number;
  /** `id` покупателя */
  userId?: number;
  /** С удалёнными */
  withDeleted?: boolean;
  /** Вместе с пользователем */
  withUser?: boolean;
}
