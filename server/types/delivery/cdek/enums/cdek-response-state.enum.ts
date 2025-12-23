export enum CDEKResponseStateEnum {
  /** пройдена предварительная валидация и запрос принят */
  ACCEPTED = 'ACCEPTED',
  /** запрос ожидает обработки (зависит от выполнения другого запроса) */
  WAITING = 'WAITING',
  /** запрос обработан успешно */
  SUCCESSFUL = 'SUCCESSFUL',
  /** запрос обработался с ошибкой */
  INVALID = 'INVALID',
}
