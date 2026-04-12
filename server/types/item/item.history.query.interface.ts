/** Параметры выборки истории товара */
export interface ItemHistoryQueryInterface {
  /** Идентификатор товара */
  itemId: number;
  /** Лимит записей */
  limit: number;
  /** Смещение */
  offset: number;
}
