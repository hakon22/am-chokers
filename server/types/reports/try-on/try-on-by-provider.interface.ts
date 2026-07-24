import type { AiProviderTypeEnum } from '@server/types/ai/enums/ai-provider-type.enum';

export interface TryOnByProviderInterface {
  /** Провайдер генерации */
  provider: AiProviderTypeEnum;
  /** Количество */
  count: number;
  /** Средняя стоимость, ₽ */
  averageCost: number;
  /** Средняя длительность, мс */
  averageDurationMs: number;
}
