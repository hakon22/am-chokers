export enum CDEKWebhooksEnum {
  /** событие по статусам */
  ORDER_STATUS = 'ORDER_STATUS',
  /** готовность печатной формы */
  PRINT_FORM = 'PRINT_FORM',
  /** получение информации о закрытии преалерта */
  PREALERT_CLOSED = 'PREALERT_CLOSED',
  /** получение информации о транспорте для СНТ */
  ACCOMPANYING_WAYBILL = 'ACCOMPANYING_WAYBILL',
  /** получение информации об изменении доступности офиса */
  OFFICE_AVAILABILITY = 'OFFICE_AVAILABILITY',
  /** получение информации об изменении заказа */
  ORDER_MODIFIED = 'ORDER_MODIFIED',
  /** получение информации об изменении договоренности о доставке */
  DELIV_AGREEMENT = 'DELIV_AGREEMENT',
  /** получение информации о проблемах доставки по заказу */
  DELIV_PROBLEM = 'DELIV_PROBLEM',
}
