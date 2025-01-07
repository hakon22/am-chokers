export enum OrderStatusEnum {
  /** Новый */
  NEW = 'NEW',
  /** Сборка */
  ASSEMBLY = 'ASSEMBLY',
  /** Собран */
  ASSEMBLED = 'ASSEMBLED',
  /** Доставляется */
  DELIVERING = 'DELIVERING',
  /** Доставлено */
  DELIVERED = 'DELIVERED',
  /** Отменён */
  CANCELED = 'CANCELED',
  /** Исполнен */
  COMPLETED = 'COMPLETED',
}
