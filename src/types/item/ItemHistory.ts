import type { PaginationInterface } from '@/types/PaginationInterface';

/** Пользователь в ответе истории товара (без пароля) */
export interface ItemHistoryUserInterface {
  id: number;
  name: string;
}

/** Одна запись `item_history` в ответе API */
export interface ItemHistoryRowInterface {
  id: number;
  created: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  user: ItemHistoryUserInterface | null;
}

/** Ответ GET истории товара */
export interface ItemHistoryResponseInterface {
  code: number;
  history: ItemHistoryRowInterface[];
  paginationParams: PaginationInterface;
}
