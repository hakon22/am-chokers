/** Вид transactional SMS-задачи в микросервисе sender (соответствует методам `SmsService`) */
export enum SmsTransactionalJobMethodEnum {
  /** Отправка кода подтверждения */
  SEND_CODE = 'SEND_CODE',
  /** Отправка пароля для входа */
  SEND_PASS = 'SEND_PASS',
  /** Отправка чека */
  SEND_RECEIPT = 'SEND_RECEIPT',
}
