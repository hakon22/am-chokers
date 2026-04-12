/** Одно зафиксированное изменение поля товара для записи в `item_history` */
export interface ItemHistoryDeltaInterface {
  /** Стабильный ключ поля */
  field: string;
  /** Предыдущее значение в виде строки для колонки `old_value` */
  oldValue: string | null;
  /** Новое значение в виде строки для колонки `new_value` */
  newValue: string | null;
}
