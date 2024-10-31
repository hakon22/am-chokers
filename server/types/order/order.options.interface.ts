export interface OrderOptionsInterface {
  /** Вместе с пользователем */
  withUser?: boolean;
  /** Вместе с позициями */
  withPosition?: boolean;
  /** С удалёнными */
  withDeleted?: boolean;
}
