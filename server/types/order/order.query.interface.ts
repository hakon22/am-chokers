export interface OrderQueryInterface {
  /** Id заказа */
  id?: number | string;
  /** Id покупателя */
  userId?: number | string;
  /** С удалёнными */
  withDeleted?: boolean;
}
