export interface TryOnByItemGroupInterface {
  /** Id группы */
  groupId: number;
  /** Название группы */
  groupName: string;
  /** Код группы для ссылки в каталог */
  groupCode: string;
  /** Количество примерок */
  tryOnsCount: number;
  /** Затраты AI, ₽ */
  totalAiCost: number;
  /** Доля оценённых примерок, % */
  ratingsShare: number;
}
