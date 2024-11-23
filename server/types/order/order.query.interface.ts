export interface OrderQueryInterface {
  /** Id заказа */
  id?: number;
  /** Id покупателя */
  userId?: number;
  /** С удалёнными */
  withDeleted?: boolean;
  /** Вместе с пользователем */
  withUser?: boolean;
}
