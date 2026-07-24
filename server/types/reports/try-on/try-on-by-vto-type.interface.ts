import type { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';

export interface TryOnByVtoTypeInterface {
  /** Тип примерки */
  vtoType: AiTryOnVtoTypeEnum;
  /** Количество */
  count: number;
  /** Доля от всех запросов, % */
  sharePercent: number;
}
