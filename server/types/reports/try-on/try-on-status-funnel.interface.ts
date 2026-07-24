import type { AiTryOnLogStatusEnum } from '@server/types/ai/enums/ai-try-on-log-status.enum';

export interface TryOnStatusFunnelInterface {
  /** Статус запроса */
  status: AiTryOnLogStatusEnum;
  /** Количество */
  count: number;
}
